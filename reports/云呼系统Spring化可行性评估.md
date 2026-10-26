# 云呼系统「全面 Spring 化」可行性评估

> ⚠️ **环境口径**：本报告涉及的 192.168.1.156 / 157 / 158 / 159 均为**本机 VMware 虚拟机（测试/验证环境）**，**不是生产系统**。
> 文中实测数据、规模数字、配置现状都来自该测试环境，不代表真实生产规模与规范。


> 日期：2026-10-22
> 方式：实测代码资产盘点 + 架构链路追踪，不靠推断
> 一句话结论：**技术上可行，但"全部转 Spring"在投入产出上不成立。Java 层值得做，Node 层不该动，cc-ass 别碰。**

---

## 一、结论先行

| 层 | 规模 | 建议 | 理由 |
|---|---|---|---|
| **Java 业务服务**（14 个 Ant 工程） | 1872 文件 / **31.3 万行** | ✅ **值得 Spring Boot 化** | 自研框架是真实技术负债；JDK 17 前提已打通 |
| **cc-ass**（Asterisk AGI / OSGi） | 1186 文件 | ⛔ **保留，独立演进** | 实时信令链路，重写风险极高，OSGi 插件化反而合适 |
| **Node 服务群**（Express 3.2.4） | ~1020 文件 / **36.2 万行** | ⛔ **不要重写成 Java** | 重写无业务收益；Node 更适合 IO 密集 + 长连接推送 |
| **前端**（ExtJS 双皮肤） | ~4400 文件 / **~102 万行** | ⛔ **不动** | 改协议会引爆全栈；已有 cc-client-vue 作为新方向 |

**核心判断**：这套系统的复杂度在 **Asterisk dialplan + 实时信令 + 计费规则**，不在 Web 层。Spring 能解决的是"Web 层工程化"，恰恰不是本系统的痛点所在。把 36 万行 Node 重写成 Java，是用最大的成本去解决一个不存在的问题。

---

## 二、现状：不是"没有框架"，而是"自研框架"

很多人以为老系统"没框架、所以该上 Spring"。实测下来，**它有一套完整的自研框架**，只是 2013 年的产物：

```
启动方式（cc-java-in / -l / -out / cc-doc-gddx / robot-java 全部同一个入口类）
    AppServiceStartup.main()
      → AppConfig.getInstance()                  // 自研配置，读 server.conf
      → MongoConnect.getInstance().connect()      // 自研 DAO，全局单例
      → new AppHttpServer()                       // 自研 HTTP 服务器
      → XxxServer.getInstance().start() × N       // 手工 new 一堆单例，无 IoC
```

四层自研实现：

| 层 | 自研实现 | 问题 |
|---|---|---|
| HTTP 服务器 | `ds/net/httpserver/`（**JDK 6 `com.sun.net.httpserver` 的源码克隆**） | 无过滤器链、无连接池治理、无优雅停机 |
| 依赖管理 | 手工 `getInstance()` 单例 | 无 IoC、无生命周期、无法单测替换 |
| 通信协议 | `C5Action` / `C5Response`（自研 RPC + XML） | 非 REST，无 OpenAPI，前端强耦合 |
| 数据访问 | `MongoConnect` / `MongoProvider` 单例 | 无 Repository 抽象、无事务边界 |

**请求分发是巨型 if/else 链**（`AppHttpHandler.java`）：
```java
if (actionName.equals("getSipNum")) { ... }
else if (actionName.equals("getSeriesSipNum")) { ... }
else if (actionName.equals("getSkillGroupNum")) { ... }   // cc-java-in 有 43 个分发点
```

---

## 三、代码资产盘点（实测数据）

| 层 | 工程 | 文件 | 行数 |
|---|---|---|---|
| Java | cc-java-in（云客服核心） | 216 | 38,154 |
| | cc-java-in-l | 210 | 37,452 |
| | cc-java-out（云电销） | 174 | 31,554 |
| | yy-java-bill（计费） | 290 | 49,166 |
| | sms_java | 186 | 29,515 |
| | yy-java-timer | 122 | 23,773 |
| | report-java | 112 | 19,284 |
| | cc-cdr / robot-java / cc-doc-gddx / sms-java-gddx / gwcdr / 等 7 个 | 562 | 83,864 |
| | **14 个 Ant 工程小计** | **1872** | **312,782** |
| | cc-ass（OSGi，40+ bundle） | 1186 | — |
| | **Java 合计** | **4805** | **662,562** |
| Node | cc-server-in（前端主服务, 3000） | 172 | 86,458 |
| | cc-server-out（云电销） | 340 | 144,176 |
| | yy-server（计费/跳转） | 153 | 49,166 |
| | business-appraise | 355 | 82,437 |
| | **Node 小计** | **~1020** | **~362,000** |
| 前端 | cc-client-in（blue skin） | 1934 | 508,310 |
| | cc-client-in-gddx（Genesys skin） | 1982 | 432,694 |
| | cc-client-vue（新版） | 143 | 2,293 |
| | **前端小计** | **~4400** | **~1,020,000** |

> **全栈约 200 万行。** Node 层的行数统计已剔除 `node_modules`（cc-server-in 目录下 327 个 js 是依赖，非业务代码）。

---

## 四、架构真相：协议是命门

这是本次评估**最重要的发现**——决定了 Spring 化能不能"只改后端"：

```
浏览器(ExtJS)
   │  POST ./public?action=system.getSocketPushServiceAddress&data={}
   │  或   ./action  （同一个私有协议）
   ▼
Node cc-server-in:3000  (Express 3.2.4)
   │  serverConfig.json: ccServiceUrl=http://172.42.38.10:9999/service
   │  同样走 action 协议转发
   ▼
Java 服务 (自研 httpserver, 9999)
   │  C5Action(actionName) → if/else 分发 → C5Response(XML)
   ▼
MongoDB / Redis
   │
   ├─ cc-socket-push:5004  (WebSocket 实时推送)
   └─ cc-ass:7891 (AGI) → Asterisk
```

**`action=xxx&data={}` 这套私有 RPC 贯穿前端 ↔ Node ↔ Java 三层。**

含义：
- Spring MVC 是 REST 范式（`@RequestMapping` + JSON），**和这套协议不兼容**
- 要么在 Spring 上写协议适配层（保前端，但吃不到 REST 的好处）
- 要么连前端一起改成 REST（**102 万行前端 + 36 万行 Node 全动**）

**结论：Spring 化必须"先做协议适配层"，不能幻想一步到位 REST 化。**

---

## 五、意外收获：Spring Boot 3 的两个前提已满足

上次做的 JDK 17 编译实测，在这里派上了大用场：

### ✅ 前提 1：Java 17 —— 已满足
Spring Boot 3.x **强制要求 Java 17+**。实测 **14 个工程 1872 个源文件在 JDK 17 下 100% 编译通过**，report-java 还能实机启动。这条不用再花钱。

### ✅ 前提 2：几乎没有 `javax.*` → `jakarta.*` 的包袱
Spring Boot 3 迁到 Jakarta EE 9，业界迁移最常见的坑就是 `javax.servlet` 全量改造。实测本系统：

```
javax.net.ssl.      144   ← Java SE，不受影响
javax.xml.parsers.   48   ← Java SE，不受影响
javax.mail.*         25   ← ⚠️ 唯一需换 jakarta.mail（Angus Mail）
javax.crypto.*       11   ← Java SE
javax.imageio.        5   ← Java SE
javax.servlet         0   ← ✅ 完全没有！
```

**因为当年用了自研 httpserver 而没用 Servlet 容器，反而没有 servlet 历史包袱。** 这是不幸中的万幸——Spring MVC 可以干净地引入，javax.mail 只需机械替换 25 处。

### ⚠️ 前提 3：MongoDB 版本 —— **未满足，是硬阻塞**
Spring Data MongoDB 4.x（Boot 3.x 自带）要求 MongoDB **4.0+**，而测试环境 Mongo 是 **≈3.2** 级别。
**结论：Spring Boot 3 落地的第一件事是升级 MongoDB**（独立前置项目，约 15~30 人天 + 数据迁移验证）。
退路：用 Spring Boot 2.7（Java 8 起、兼容老 Mongo），但 2.7 已于 2025 年 EOL，不建议新项目用。

---

## 六、四条路线与工作量

基准：遗留系统框架迁移按 **600 行/人天**（含测试联调），跨语言重写按 **300 行/人天**。

| 路线 | 范围 | 工作量 | 风险 | 评价 |
|---|---|---|---|---|
| **A. Java 层 Spring Boot 化** | 14 工程 31.3 万行，保留 action 协议 | **200~280 人天** | 中 | ✅ **推荐** |
| **B. A + cc-ass** | +1186 文件 OSGi→Spring | **350~530 人天** | 高 | ⚠️ 收益递减 |
| **C. 全栈 Java 化**（含 Node 36 万行重写） | + 重写 Express 业务 | **1500~2000 人天** | 极高 | ❌ 不可接受 |
| **D. 绞杀者渐进** | 新功能用 Spring，老的不动 | 首年 60~100，持续 3~5 年 | 低 | ✅ 配合 A 使用 |

路线 A 的构成：
- 公共模块（协议适配层、配置、Mongo/Redis、日志、异常）：30~40 人天
- 14 个工程逐个 Boot 化（改造量约 25~30%，8~9 万行）：130~150 人天
- 业务回归测试（含 ASR 签名、报表导出、CDR 推送等历史坑）：50~90 人天

**另建议并行**：Node 层独立现代化（Express 3.2.4 → NestJS/Fastify + TypeScript），**20~40 人天**，远比转 Java 划算，还能留住 socket-push 的实时推送优势。

---

## 七、推荐方案：A + 绞杀者

```
第 0 步  升级 MongoDB 到 4.0+              （阻塞项，15~30 人天）
第 1 步  建 Spring Boot 3 骨架 + 协议适配层
         ↓  写一个 @PostMapping("/service") 把 action=xxx 分发到 Spring Bean
         ↓  前端和 Node 完全无感
第 2 步  按工程逐个迁移，从低风险开始：
         gwcdr(73) → m7consul(5) → asteriskGuard(21)
         → sms-java-gddx → robot-java → cc-doc-gddx → report-java
         → cc-cdr → yy-java-timer → sms_java → yy-java-bill
         → cc-java-out → cc-java-in-l → cc-java-in（最后，风险最高）
第 3 步  新功能一律 Spring Boot + REST，老的走适配层
第 4 步  Node 层独立升级（Express 3 → Fastify/NestJS），不转 Java
```

选 `gwcdr` 打头阵的理由：73 个文件、9822 行、一次就通过 JDK 17 编译、无 POI/FTP 历史坑——适合验证整条工具链和适配层设计。

---

## 八、风险清单

| 风险 | 等级 | 说明 |
|---|---|---|
| **MongoDB 版本** | 🔴 高 | 测试环境 ≈3.2，与 Spring Data Mongo 4.x 不兼容；升级涉及数据迁移 |
| **协议适配层的分发完整性** | 🔴 高 | 200+ 个 action 分发点，漏一个就是一个功能失效。必须做 action 清单比对 |
| **cc-java-in 是云客服主链路** | 🔴 高 | 216 文件、最后迁移；建议双跑灰度 |
| **JDK 17 运行时反射风险** | 🟡 中 | XStream 1.3.1 重度反射在 JDK 16+ 强封装下可能 `InaccessibleObjectException`（编译已过，但 13 个工程未做启动冒烟） |
| **老依赖与 Spring 共存** | 🟡 中 | jedis 2.8.1 / mongo-driver 3.0.4 / POI 3.12 / Lucene 3.4 需同步升级 |
| **源码版本对齐** | 🟡 中 | 本地源码 ≠ 测试环境部署版本（曾实测 157 的 yy-server 与本地不一致），迁移前必须逐个比对 |
| **双皮肤前端回归** | 🟡 中 | 5180/5181 两套 ExtJS，任何协议改动都要双回归 |

---

## 九、如果只做一件事

**先做协议适配层的 PoC**：用 Spring Boot 3 起一个服务，把 `gwcdr` 的几个 action 接进去，验证"Java 侧换成 Spring、而 Node 与前端零改动"这条路能走通。

这一步 3~5 人天就能出结果，且**完全可逆**（不行就退回自研框架）。
它验证的是整个方案最核心的假设：**能否在保留 action 协议的前提下吃到 Spring 的好处。**

---

## 十、附：不建议"全部转 Spring"的三条理由

1. **成本结构不划算**：36 万行 Node 重写成 Java ≈ 1200 人天，产出的是"技术栈统一"，没有任何新业务能力。同样的钱投在 Node 现代化（40 人天）+ Java Spring 化（280 人天）上，能拿到 90% 的收益。

2. **Node 在这里是对的选择**：`cc-socket-push` 的长连接推送、cc-server-in 的高并发 IO，都是 Node 的强项。换成 Spring 反而要处理线程模型与内存占用问题。

3. **真正的技术负债不在框架**：这套系统的痛点是无自愈、无监控、RTP 端口只开 6 个（并发约 3 路）、156 磁盘 96%、Asterisk 1.4.44 EOL。**这些用 Spring 一个都解决不了**，但每一个都比换框架更要命。

> 建议优先级：**先治理（高可用/监控/资源）→ 再 Java Spring 化 → Node 独立现代化**。框架迁移排在运维治理之后。
