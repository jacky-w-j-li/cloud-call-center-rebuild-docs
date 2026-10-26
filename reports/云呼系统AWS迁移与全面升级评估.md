# 云呼系统 AWS 迁移 + 全量升级评估

> ⚠️ **环境口径**：本报告涉及的 192.168.1.156 / 157 / 158 / 159 均为**本机 VMware 虚拟机（测试/验证环境）**，**不是生产系统**。
> 文中实测数据、规模数字、配置现状都来自该测试环境，不代表真实生产规模与规范。


> 评估时间：2026-10-20（**已修订 v2**：更正了初版对 Java 源码的错误判断）
> 前提变更：不再受现有硬件约束；目标是 AWS + **全部软件升级到最新版本**
> 依据：现有系统实测数据 + Asterisk 官方版本生命周期 + AWS 官方 EKS/NLB 最佳实践 + **本地源码树实际盘点**

> **v2 修订说明**：初版我判断"Java 6 组件只有 jar、无源码、无法升级"，这是**错的**——我当时只看了服务器运行目录，没核对本地源码树。实际 `D:\lwj\workspace\` 与 `D:\lwj\容联\源码\` 下有**全部 Java 源码 + Ant 构建脚本 + SVN 版本历史**（ASS 就有 1186 个 java 文件）。因此"全量升级"目标**可以达成**，Java 侧从"死结"降级为"20~40 人天的编译适配工作"。详见 §3.3。

---

## 0. 结论先行

**三个判断：**

1. **去 AWS 完全可行，且比留在现网好得多**——硬件、内核、自愈、数据冗余这些你现在的痛点，AWS 全部一次性解决。

2. **"全部升级到最新版本"可以达成，但代价接近「重写」而非「升级」。** 最大的坎是 **Asterisk 1.4.44 → 现代版本**：`chan_sip` 在 Asterisk 21 已被**删除**，`res_monitor` 也被**删除**（你所有录音代码 `Monitor(wav,...,b)` 会直接失效），配置模型从"一个 section"变成"endpoint/auth/aor/transport 多个对象"。这不是改配置，是重写 dialplan 层。
   **好消息是 Java 侧不再是障碍**——源码齐全（见 §3.3），可以重新编译升级。

3. **有一件事比技术更该先确定：电话号码和线路怎么落地。** 你有 293 个服务号 + 运营商 trunk（`polylink-international` → `47.90.45.121`）。**中国大陆的呼叫中心号码受电信监管约束**，AWS 海外区域不能直接落地大陆号码。这个问题不先回答，后面所有架构设计都是空中楼阁。

4. **还有一个必须先做的动作：源码版本对齐。** 源码齐全 ≠ 源码等于测试环境部署版本（我实测过 157 的 yy-server 与本地源码树版本不一致）。迁移前必须确认本地源码能重建出与测试环境部署版本一致的产物，否则编译出来的东西业务行为可能对不上。

---

## 1. 先确认三个前提（这决定整个方案走向）

| # | 问题 | 为什么关键 |
|---|---|---|
| **Q1** | 这 293 个服务号、外呼线路，是**大陆号码**还是国际/香港号码？客户主要在哪个地区拨打？ | 大陆号码受工信部监管，呼叫中心需持证经营，号码必须经有资质运营商落地。**AWS 海外区无法直接落地大陆号码**，需走 SBC 中转或 AWS 中国区（北京/宁夏，由光环新网/西云数据运营，还需 ICP 等资质）。 |
| **Q2** | 这套系统是**自用/学习/技术验证**，还是**要继续商用生产**？ | 决定投入产出模型。商用生产的话，"重写闭源第三方系统"的性价比可能低于"换架构重做"或"买商业 SaaS"。 |
| **Q3** | 需要保留多少历史数据？并发峰值多少路？ | 决定实例规格与出网流量成本（RTP 是持续双向 UDP，出网流量是长期成本大头）。 |

> 我在报告里按「Q1 = 需要大陆号码 + 需要保留现有业务」这个最复杂的情况来设计，如果你的答案更简单，方案可以大幅简化。

---

## 2. AWS 目标架构

### 2.1 服务映射

| 现有组件 | AWS 方案 | 说明 |
|---|---|---|
| **Asterisk ×13**（159 上 11 + 156 上 2） | **EC2（公网子网）+ EIP**，或 EKS `hostNetwork` | ⚠️ **不能放私有子网**：SDP 要通告真实可路由 IP，NAT Gateway 只出不进。这是所有自建 SIP 的通用约束。 |
| **clpms（FreeSWITCH）×2** | 同上 | 外呼最后一跳，同样需要公网 IP |
| **SIP 入口（UDP 6060~6069 / 5072）** | **NLB（UDP）** | ALB 只支持 HTTP/HTTPS，**UDP 必须用 NLB**。NLB 提供**静态 IP**，话机可写死。 |
| **RTP（10000-20000 UDP）** | **直连节点公网 IP**（不走 NLB） | RTP 端口量大且动态，直接暴露节点；安全组限制来源为运营商网段 |
| **cc-server-in/out、socket-push、webim、yy-server、report** | **EKS Deployment** 或 ECS | 无状态 HTTP，最容易容器化 |
| **nginx** | **ALB + Ingress**（HTTP 部分）/ NLB（SIP 部分） | 收敛多端口 |
| **MongoDB 3.2** | 见 §4.3 —— **这是难点** | DocumentDB 只兼容 Mongo 3.6/4.0/5.0；若升到 7.x 需用 Atlas 或 EC2 自建 |
| **Redis** | **ElastiCache for Redis** | 你现在 AOF 是 0 字节（纯缓存），迁移零成本 |
| **MySQL** | **RDS MySQL/PostgreSQL** | 数据量小（45MB 进程），迁移简单 |
| **Elasticsearch** | **OpenSearch** | 现有数据仅 ~90KB（3 个索引），**可直接重建，不用迁** |
| **Solr（157:18190）** | 评估是否真在用；若用可换 OpenSearch 统一 | ES 数据几乎为空，可能 Solr 同理 |
| **录音文件** | **EFS（RWX，实时写入）+ S3（30 天后归档，生命周期转 IA/Glacier）** | EFS 贵但支持多节点共享；S3 便宜做归档 |
| **租户配置 `/etc/asterisk/accounts/*`** | **EFS（RWX）** | ⚠️ 页面改 IVR 会写回 `.ael` 再 reload，**必须是可写共享存储，不能是 ConfigMap** |
| **语音文件 / sounds** | **EFS** 或打进镜像（只读） | 40MB，两者皆可 |
| **服务发现 Consul** | **删除**，用 K8S Service DNS / Cloud Map | 上云后 Consul 是多余的 |
| **asteriskGuard** | **删除**，用 K8S livenessProbe / EC2 Auto Recovery | 现在这玩意儿只监控不重启 |
| **阿里 TTS / ASR** | **Amazon Polly / Transcribe**，或保留阿里云（若需中文方言） | 中文语音质量需实测对比 |
| **日志** | **CloudWatch Logs**（替代现在 1.6G 的本地日志） | |

### 2.2 网络布局（关键）

```
VPC 10.0.0.0/16
├── Public Subnet AZ-a (10.0.0.0/24)
│   ├── Internet Gateway
│   ├── NLB（SIP 入口，静态 IP）
│   ├── EKS Node Group / EC2: Asterisk Pod（hostNetwork，绑 EIP）
│   └── clpms（FreeSWITCH）
├── Public Subnet AZ-b (10.0.1.0/24)   ← 多 AZ 冗余
│   └── 同上
├── Private Subnet AZ-a/b
│   ├── EKS 控制平面 ENI
│   ├── 业务服务 Pod（cc-server-in 等）
│   ├── ElastiCache / RDS / DocumentDB
│   └── NAT Gateway（供私有子网出网，如调阿里 TTS）
└── S3 / EFS（区域级服务）
```

**三条硬规则：**
1. **SIP/RTP 节点必须在公网子网**，有可直接路由的公网 IP（EIP 或 NLB）。
2. **NLB 保留源 IP**（默认行为），适合 SIP；但 RTP 建议直连节点。
3. **安全组严格限制**：SIP 端口只对运营商/已知网段开放，RTP 端口段对客户来源开放。SIP 服务器暴露公网必然被扫，这是常态，要做好 fail2ban / 速率限制。

---

## 3. 「全部升级到最新版」的真实代价

> 先说一个原则性提醒：**生产系统的正确目标是「受支持的 LTS 版本 + 及时安全更新」，而不是「最新版本」。** 追最新版会把你绑在 6 个月一次的升级周期上。下面按 **LTS** 来评估。

### 3.1 Asterisk 1.4.44 → 22 LTS：这是整个迁移的最大工程

**版本现状（已核实）**：
- Asterisk **18 LTS 已 EOL**
- **Asterisk 21 已移除 `chan_sip`**（21 及之后所有版本都没有了）
- Asterisk 21 现在进入 Security-Fix-Only，**到 2026 年 10 月结束**（就是本月）
- 当前主线：**Asterisk 22 LTS**（推荐）/ 23 标准版

**你必须面对的破坏性变更**（逐条对照你的系统）：

| 变更 | 你的现状 | 影响 |
|---|---|---|
| **`chan_sip` 被删除** | 全部配置是 `sip.conf`，dialplan 里 `Dial(SIP/...)` | **必须转 PJSIP**。`sip.conf` → `pjsip.conf`，配置模型从 1 个 section 变成 **endpoint + auth + aor + identify + transport** 五个对象 |
| **`res_monitor` 被删除** | 录音全部是 `Monitor(wav,${RECFILENAME},b)`（13 处） | **所有录音代码失效**，必须改成 `MixMonitor()`。且 `b` 参数（接通才录）语义要重新实现 |
| **`app_macro` 被删除** | 若 dialplan 用了 `Macro()` | 改为 `Gosub()` |
| **`app_cdr` 被删除** | CDR 相关 | 检查 cdr.conf 配置方式 |
| **`users.conf` 弃用** | ⚠️ 注意区分：你的 `accounts/*/conf/users.conf` 是**应用自己的坐席配置**（不是 Asterisk 的 users.conf），不受影响；但 `accounts/*/sip.conf` 是**真正的 Asterisk sip.conf**，必须转 | 别搞混这两个同名文件 |
| **`MeetMe()` → `ConfBridge()`** | `threewaycall` 用 `MeetMe(${EXTEN},dqx1MF)`；`app_meetme` 依赖 DAHDI 时序源 | 改 ConfBridge（也不需要 DAHDI，反而更简单） |
| **`nat=yes`/`externip`/`localnet`/`canreinvite`** | sip.conf 里大量使用 | PJSIP 对应：`rtp_symmetric` / `force_rport` / `rewrite_contact` / `direct_media` / `local_net` |
| **`dtmfmode=rfc2833`** | 分机配置 | → `dtmf_mode=rfc4733`（同一机制，改名） |
| **G.729** | gateway 分机 `allow=g729` 独占 | 新版 Asterisk 默认不带 G.729（专利）。要么买授权模块，要么改用 alaw/opus。**这是业务改造，不只是技术** |
| **AEL 语法** | 28 个 `.ael` 文件/租户，1.4 时代语法 | AEL 大体兼容，但 `${VAR}` 求值、函数集合有变化，**需要逐条跑通** |
| **85 处 AGI 调用** | `agi://127.0.0.1:7891/*`，全部走 ASS(Java 6) | AGI 协议本身兼容，但 ASS 是 Java 6，**它自己也要升级**，否则整个链路卡住 |
| **`sip_test.conf`（5000~5007 测试分机）** | 你用来进 IVR 的那套 | 也要转 PJSIP |

官方提供了转换脚本 `contrib/scripts/sip_to_pjsip/sip_to_pjsip.py`，但官方文档明确说**它不能覆盖所有场景，输出只能当草稿**。你的配置里有 `type=friend`、`qualify`、`call-limit`、`insecure=port,invite` 这些复杂项（PJSIP 没有 friend/peer/user 区分），**转换后必须逐条人工校验**。

**工作量**：dialplan + 配置转换 + 85 处 AGI 回归 + 6322 个分机重新注册验证。我估 **40~60 人天**，且这是**最高风险**的部分——出错直接导致无法通话。

> 顺带说一句：好消息是 Asterisk 进程很轻（实测有租户的 `.0` 实例 RSS 仅 13MB），云上规格不用给大。

### 3.2 Node v6.10.0 → 22 LTS

- Node 6 的代码用了 `--debug-port` 等老参数，大量回调风格代码。
- npm 依赖（`mongodb@3.7.4`、`express` 老版本、`socket.io` 老版本）**大多需要重写调用**。举例：MongoDB 驱动从 3.x 到 6.x，API 变化巨大（`MongoClient` 用法、Cursor API、callback vs promise）。
- `cc-server-in`、`cc-server-out`、`socket-push`、`webim`、`im-node`、`yy-server`、`report-node`、`uba-server` 等至少 **8 个 Node 服务**。
- **工作量**：25~40 人天（取决于代码质量与是否有单测）。

### 3.3 Java 6 → 21：可行（**已更正**，源码齐全）

> ⚠️ **更正**：我在初版里判断"jar 无源码、无法升级、是死结"，这是**错的**。我当时只看了服务器上 `/opt1/*-gddx/` 的运行目录（那里确实只有 jar），没有核对本地源码树。你提醒后我重新盘了一遍——**所有 Java 组件的源码都在，且带构建脚本和 SVN 版本历史**。下面按更正后的事实重写。

**源码资产盘点**（`D:\lwj\workspace\` 是 Eclipse workspace，`D:\lwj\容联\源码\` 是按产品分的项目树）：

| 工程 | Java 文件数 | 对应部署组件 | 位置 |
|---|---|---|---|
| **cc-ass** | **1186** | **`/opt/ass/equinox.jar`（ASS 状态服务器，AGI 7891，85 处依赖）** | `workspace/cc-ass/` |
| yy-java-bill | 290 | `bill.jar`（156，Java 6） | `workspace/yy-java-bill/` |
| cc-java-in | 216 | `cc-java-in.jar`（156:9999，Java 6） | `workspace/cc-java-in/` |
| cc-java-in-l | 210 | 同上（另一分支） | `workspace/cc-java-in-l/` |
| cc-java-out | 174 | `cc-java-out.jar`（`-Xmx2048M`） | `workspace/cc-java-out/` |
| cc-doc-gddx | 118 | `cc-java.jar` | `workspace/cc-doc-gddx/` |
| report-java | 112 | `report-java.jar`（157） | `workspace/report-java/` |
| robot-java | 112 | 机器人服务 | `workspace/robot-java/` |
| asteriskGuard | 21 | `asteriskGuard.jar`（可删，换 livenessProbe） | `workspace/asteriskGuard/` |
| 其他 | — | `cc-cdr`、`gwcdr`、`cccdr__24`、`fss_gateway`、`m7consul`、`sms-java-gddx`、`yy-java-timer` | `workspace/` |
| **pbx（SVN 仓库）** | — | **`branches/` + `trunk/` + `hooks/`** —— 完整版本历史 | `容联/源码/pbx/` |
| 云客服产品线 | — | `cc-client-in`(前端)、`cc-server-in`、`cc-socket-push`、`cc-timer`、`multichannel-assign-java`、`report-node`、`kefu-node-server`、`sms-java`、`sensitive-java`、`collector`、`gateway` | `容联/源码/云客服/` |
| 云电销产品线 | — | `cc-client-out`、`cc-server-out`、`cc-java-out`、`cc-doc`、`cc-product`、`cc-data-handler` | `容联/源码/云电销/` |

**结论：不是死结，是"编译适配 + 依赖升级 + 回归"的工程量。**

**升级阻塞点（已实测扫描）**：

| 阻塞点 | 实测结果 | 处理 |
|---|---|---|
| **`sun.*` 内部类** | **8 个文件**引用（`ds/net/httpserver/ServerImpl.java`、`HttpServerProvider.java`、`Utils.java` 等） | 主要是 `com.sun.net.httpserver` —— 这是 JDK **支持**的 API（非私有），Java 9+ 归入 `jdk.httpserver` 模块。处理：`--add-modules jdk.httpserver` 或 `module-info` 里 `requires jdk.httpserver`。**可解决** |
| **`javax.xml.bind` / `javax.activation`** | **未使用**（Java 11 移除的重灾区） | 无阻塞 ✅ |
| **构建方式** | **Ant（`build.xml`）**，`javac` 未指定 source/target | 可保留 Ant，或迁 Maven/Gradle 便于依赖管理 |
| **第三方依赖版本** | `jedis-2.8.1`、`json-lib-2.2.2-jdk15`、`dom4j-1.6.1`、`jdom-1.1`、`commons-codec-1.5`、`httpclient-4.5.2`、`consul-api-1.2.1`、`aliyun-sdk-oss-2.6.0`、`IKAnalyzer3.2.8` | 均可升级到现代版本，但 **API 有变化需改代码**（如 jedis 2.x → 5.x、json-lib → Jackson/Gson） |
| **ASS 是 OSGi 架构** | 含 `com.m7.cc.ass.osgi`，测试环境跑 `equinox.jar`（Eclipse Equinox） | Java 21 + JPMS 与 OSGi 的模块边界需处理；Equinox 需升到支持 Java 21 的版本，或迁 Apache Felix。**这是 Java 侧最复杂的一块** |

**工作量（更正后）**：**20~40 人天**（编译适配 + 依赖升级 + 行为回归），而不是初版估的 30~80 人天。风险从"可能破产"降为"中等可控"。

> ⚠️ **但有个前提必须先验证：源码与测试环境部署版本是否一致。**
> 我之前排查 157 的 yy-server 时实测发现：**服务器上跑的代码与本地源码树 `自建/yy-server` 版本不同**（157 的 `redirectCCInLogin` 用 `ccInUrl`，本地源码用 `ccServerUrl`）。所以源码齐全 ≠ 源码等于测试环境部署版本。
> **迁移前必须做版本对齐**：用 SVN 版本号 / 构建时间 / 关键文件 diff 逐个比对，确认本地源码能重建出与测试环境部署版本一致的产物。这一步不做，后面编译出来的东西可能对不上业务行为。

### 3.4 MongoDB 3.2 → 现代版本

- 现在 Mongo 是 ≈3.2（maxWireVersion 4），非副本集单点。
- **AWS DocumentDB 只兼容 MongoDB 3.6 / 4.0 / 5.0 协议**。如果你升到 MongoDB 7.x/8.x，DocumentDB 就**不能用**了。
- 方案选择：
  - **DocumentDB**（托管，省心）—— 但只能升到 5.0 兼容层，且不支持 Mongo 所有特性（需逐个验证你的 129 个集合的用法）
  - **MongoDB Atlas on AWS**（官方托管，可用最新版）—— 成本略高但兼容性最好
  - **EC2 自建 MongoDB 7/8 副本集** —— 最灵活，但要自己运维
- 数据只有 985M，迁移本身不难；难的是**驱动重写**（Node 侧）。
- **工作量**：10~20 人天（含驱动改造与验证）。

### 3.5 其他

| 组件 | 现状 | 升级路径 | 难度 |
|---|---|---|---|
| CentOS 6.10 / 7.9 | — | **Amazon Linux 2023** 或 Ubuntu 22.04 LTS | 低（新环境，无需原地升级） |
| Tomcat 8.0.53 | 157 | Tomcat 10.1（注意 `javax.*` → `jakarta.*` 命名空间变更，**破坏性**） | 中 |
| ES（老版本） | 157，数据 90KB | OpenSearch 2.x，**直接重建** | 低 |
| Solr 8190 | 157 | 评估是否真在用，可并入 OpenSearch | 低 |
| Redis | 156，AOF 0 字节 | ElastiCache，**零数据迁移** | 低 |
| nginx | 全 | ALB/NLB 或 nginx 容器 | 低 |
| Consul 3 节点 | 全 | **删除**，用 K8S DNS / Cloud Map | 低（但代码里的 `consulClient.remoteUrl()` 要改） |

---

## 4. 三条路线对比

| 路线 | 做法 | 工作量 | 风险 | 获得什么 |
|---|---|---|---|---|
| **A. Lift & Shift** | 同版本原样搬到 EC2（Docker 化但不升级） | **15~25 人天** | 低 | 硬件/自愈/备份/冗余全部解决；**但软件仍全是 EOL，CVE 一堆** |
| **B. Replatform** | 搬到 AWS + 用托管服务（RDS/ElastiCache/DocumentDB/OpenSearch/EFS）+ **应用层只做必要的兼容性改造，不追最新版** | **40~60 人天** | 中 | 拿到云的全部红利，软件升到"受支持"而非"最新"（如 Asterisk 20 LTS 仍有 chan_sip） |
| **C. Refactor / 升级改造** | 全部升级到受支持版本 + Asterisk PJSIP 化 + **Java 组件基于源码重新编译升级** | **90~150 人天**（初版估 120~200） | **高** | 彻底现代化 |

> 注：C 的工作量因"源码齐全"这一更正而**下调**（Java 侧从 30~80 降到 20~40）。初版估的 120~200 是按"Java 要重写"算的，现在只需编译适配。

### 我的推荐：**B 起步，Asterisk 走「20 LTS → 后续 PJSIP」的两步走**

理由：

1. **Asterisk 20 LTS 仍然保留 `chan_sip`**（21 才移除）。所以你可以：
   - **第一步**：升到 Asterisk 20 LTS —— 一次跨 18 年的跳跃，但 `sip.conf`、`Monitor()`、`Dial(SIP/...)` 都还在，**dialplan 基本不用改**，只需处理版本差异。
   - **第二步**（后续独立项目）：在 20 上做 **dual-stack**（chan_sip 绑 6060，PJSIP 绑 6160），按租户批量迁移，验证通过后再整体切到 22 LTS。
   
   这比"一步跳到 22 + 强制 PJSIP 化"的风险低一个数量级。

2. **Java 组件可以先原样容器化（跑老 JDK）保证不阻塞，再并行做编译升级**——因为源码在手，升级是"确定能做"，只是排期问题。**优先升 Node（收益明确、风险低），Java 排在其后。**
   唯独 **ASS（cc-ass，1186 个 java 文件，OSGi/Equinox 架构）** 要单独评估：它是 85 处 AGI 的依赖，Java 21 + JPMS + OSGi 的模块边界处理是 Java 侧最复杂的一块。

3. **Node 服务升级到 18/22 LTS** —— 这个收益明确（安全 + 可维护），工作量可控，优先做。

4. **Mongo 用 DocumentDB 或 Atlas** —— 先看你的驱动改造能支持到哪个协议版本。

> 如果 Q1 的答案是"这是自用/技术验证项目"，那我建议你直接走 **C，但换一套架构**：用 **Kamailio（SIP 前端/分发）+ Asterisk 22 或 FreeSWITCH（媒体/IVR）+ 现代 Node/Go 业务层** 重新设计。考虑到你本身就是 Asterisk/Kamailio/FreeSWITCH 的社区贡献者，**重新设计一套你完全掌握的架构，比改造别人闭源的十年前代码，长期成本低得多，也更可控。**

---

## 5. 分阶段实施计划

### 阶段 -1：源码资产核对（3~5 天，**新增，必须最先做**）
> 这一阶段是因为"源码齐全但可能不等于测试环境部署版本"而新增的。
- [ ] **版本对齐**：逐个工程核对本地源码能否重建出与测试环境部署版本一致的产物（比对 SVN 版本号、构建时间、关键类 diff）。已知风险点：157 的 yy-server 与本地 `自建/yy-server` **版本不一致**（157 的 `redirectCCInLogin` 用 `ccInUrl`，本地用 `ccServerUrl`）
- [ ] **可编译性验证**：用现代 JDK（17/21）试编译各工程，记录失败项（预期集中在 `com.sun.net.httpserver`、老依赖 API）
- [ ] **依赖清单梳理**：各工程 `lib/*.jar` → 现代坐标（Maven），标出需要改代码的 API
- [ ] **ASS 专项评估**：`cc-ass`（1186 文件，OSGi/Equinox）在 Java 21 + JPMS 下的可行性验证
- **验收**：产出《源码可升级性清单》，每个工程标注：可直编 / 需小改 / 需重构 / 版本不符

### 阶段 0：前提确认与 PoC（2~3 周）
- [ ] 回答 Q1/Q2/Q3（号码合规、商业目标、并发规模）
- [ ] **PoC：在 AWS 上用 Asterisk 20 LTS 起一个实例，导入 489 租户配置，打通一次完整呼入**（含 AGI、录音、IVR 放音）。
  ⚠️ 注意：即便用 20 LTS（保留 chan_sip），也要先验证 **`MixMonitor` 替代 `Monitor()`** —— 因为 `res_monitor` 虽在 20 中还在，但这是迟早要改的，PoC 阶段一起验掉
- [ ] PoC：DocumentDB / Atlas 兼容性验证（用真实查询跑一遍）
- [ ] PoC：挑一个 Java 工程（建议 `report-java`，112 文件较小）做 JDK 21 编译 + 冒烟
- **验收**：一通电话从服务号进来到坐席接起，录音落盘，CDR 写库

### 阶段 1：云底座 + 数据层（3~4 周）
- VPC / 子网 / 安全组 / EKS（或 ECS）
- RDS、ElastiCache、DocumentDB/Atlas、OpenSearch、EFS、S3
- 数据迁移（Mongo 985M、MySQL、ES 重建）
- **验收**：数据一致性校验通过

### 阶段 2：无状态业务层上云（4~6 周）
- cc-server-in/out、socket-push、webim、yy-server、report 容器化 + 升级 Node
- 配置外置（Secret Manager / ConfigMap），删掉所有硬编码 IP
- 删 Consul，改用 K8S DNS
- ALB 收敛 HTTP 入口
- **验收**：云客服/云电销/计费/用户中心全部功能回归（含之前修的 4 类跳转）

### 阶段 3：媒体层上云（4~6 周，**最高风险**）
- Asterisk 20 LTS 部署在公网子网 EC2/EKS hostNetwork
- NLB（UDP）暴露 SIP，RTP 直连
- clpms（FreeSWITCH）同迁
- ASS（AGI）、aliTts/aliAsr 迁移（或换 Polly/Transcribe）
- 6322 个分机分批切换注册
- **验收**：并发压测 + 录音 + 转接 + 会议 + 外呼全链路

### 阶段 4：现代化收尾（可选，独立立项）
- Asterisk 20 → 22 LTS（PJSIP 化，dual-stack 分批迁移）
- Java 组件基于源码升级到 JDK 21（按阶段 -1 清单逐项推进；ASS 单独排期）
- MeetMe → ConfBridge
- G.729 授权或改编码
- 观察期与旧环境并行运行，灰度切流

---

## 6. 成本粗估（月度，us-east-1 按需价）

| 项 | 规格 | 月成本（约） |
|---|---|---|
| EKS 控制平面 | 1 集群 | $72 |
| EKS/EC2 节点 | 6 × m6i.2xlarge (8C32G) | $1,700 |
| Asterisk/clpms 节点 | 2 × c6i.2xlarge（公网子网 + EIP） | $500 |
| DocumentDB 或 Atlas | 3 节点 r6g.large | $700 |
| ElastiCache Redis | 2 × cache.r6g.large | $300 |
| RDS MySQL | 2 × db.r6g.large（多 AZ） | $500 |
| OpenSearch | 3 × r6g.large.search | $700 |
| EFS | 200GB（配置 + 实时录音） | $60 |
| S3 | 2TB（录音归档，含生命周期） | $50 |
| NLB + ALB | 各 1 | $60 |
| **出网流量（RTP）** | 100 路并发 ≈ 2.8TB/月 | **$250**（并发翻倍则翻倍） |
| CloudWatch / 备份 / 其他 | — | $200 |
| **合计（按需）** | | **≈ $5,100/月** |
| **用 Savings Plan / RI（1 年，约省 40%）** | | **≈ $3,100/月** |

> ⚠️ 这是粗估，需要按你的实际并发峰值精算。**RTP 出网流量是长期可变成本**，并发越高越贵。如果用户在大陆而区域选海外，还要叠加跨境延迟与专线成本。

---

## 7. 风险清单

| 风险 | 影响 | 缓解 |
|---|---|---|
| **源码与部署版本不一致** ⚠️ **新增** | 编译产物业务行为对不上，回归地狱 | **阶段 -1 版本对齐**（已知 157 的 yy-server 与本地源码不一致）；逐个工程比对 SVN 版本与产物 |
| **ASS 是 OSGi/Equinox + 1186 文件** | Java 21 + JPMS 模块边界可能不兼容；且它是 85 处 AGI 的依赖 | 单独排期 PoC；准备 Equinox 升级或迁 Felix 的预案 |
| **Asterisk PJSIP 化** | 配置转换出错 → 无法通话 | 走 20 LTS 两步走 + dual-stack 灰度 |
| **录音失效**（`res_monitor` 移除） | 全部录音丢失 | 提前改 `MixMonitor`，PoC 阶段就验证 |
| **号码/线路合规** | 业务根本跑不起来 | **最优先确认**，必要时走 AWS 中国区或保留本地网关中转 |
| **G.729 缺失** | gateway 分机无法呼叫 | 购买授权模块或全量改 alaw/opus |
| **AGI（ASS）同步依赖** | ASS 延迟/不可用 → 呼叫建立失败 | ASS 与 Asterisk 同 AZ 部署，做本地缓存降级 |
| **6322 个分机切换** | 切换期业务中断 | 分批 + 保留旧环境并行，DNS/NLB 灰度切流 |
| **第三方商业软件授权** | 重打包代码商用有 IP 风险 | 上云前先做法律确认（你之前记录过这一条） |

---

## 8. 我的建议

1. **先回答 Q1（号码合规）**——它决定 AWS 区域选择，进而决定整个架构。这一条没答案，后面的设计都要推倒重来。

2. **不要一上来就追求"最新版"**。目标是 **Asterisk 20 LTS + Node 22 LTS + Amazon Linux 2023 + 托管数据服务**，这已经是巨大跨越（从 2012 年的软件栈到 2026 年受支持的栈），而且**风险可控**。

3. **Asterisk PJSIP 化单独立项**。它是独立的、高风险的项目，不该和"上云"绑在一起做。上云先成功，PJSIP 化后续再说。

4. **立刻做阶段 -1（源码版本对齐）**。源码在手让"全量升级"从不可能变成可行，但**前提是确认源码能重建出与测试环境部署版本一致的产物**。这一步只要几天，却决定了后面所有编译升级工作的可信度。

5. **如果你的目的是掌握一套现代化呼叫中心架构，而不是维护这套十年前的第三方代码**——考虑到你的 Asterisk/Kamailio/FreeSWITCH 背景，**用 Kamailio + 现代 Asterisk/FreeSWITCH + 自研业务层重新设计，长期看可能比重构它更划算，也更能发挥你的技术优势。**
   不过既然源码齐全，你也可以在"读懂现有实现"之后再决定是改还是重写——**源码在手意味着两种选择都敞开**，这是比初版判断乐观得多的局面。

---

## 附录：本次评估的事实依据

| 事实 | 来源 |
|---|---|
| Asterisk 18 EOL、21 移除 chan_sip、21 进入 SFO（至 2026-10） | Asterisk 官方公告 asterisk.org |
| `res_monitor`、`app_macro`、`app_cdr` 在 21 被移除；`users.conf` 弃用 | Asterisk 21.0.0 ChangeLog |
| PJSIP 配置模型（endpoint/auth/aor/transport/identify）、`sip_to_pjsip.py` 局限性 | Asterisk 官方迁移文档 |
| SIP/RTP 必须在公网子网、NLB 支持 UDP 与静态 IP、EKS hostNetwork 模式 | AWS EKS 最佳实践 + SIP 服务器设计实践 |
| 现网实测数据（版本/内存/端口/配置耦合/数据量） | `D:\lwj\k1_159.txt`、`k2_156.txt`、`k3_157.txt`、`k4_ver.txt` |
| **本地源码资产盘点**（v2 更正依据） | `D:\lwj\workspace\`（Java 工程）、`D:\lwj\容联\源码\云客服\|云电销\|pbx(SVN)` |
| Java 升级阻塞点扫描（`com.sun.net.httpserver` 8 处、无 `javax.xml.bind`、依赖清单） | 本报告 §3.3 实测 grep |

关联：`D:\lwj\云呼系统K8S迁移方案分析.md`、`D:\lwj\云呼系统高可用评估报告.md`、`D:\lwj\云呼系统业务功能全景分析.md`
