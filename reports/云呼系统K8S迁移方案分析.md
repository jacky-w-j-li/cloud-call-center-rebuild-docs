# 云呼系统 K8S 迁移方案分析

> ⚠️ **环境口径**：本报告涉及的 192.168.1.156 / 157 / 158 / 159 均为**本机 VMware 虚拟机（测试/验证环境）**，**不是生产系统**。
> 文中实测数据、规模数字、配置现状都来自该测试环境，不代表真实生产规模与规范。


> 分析时间：2026-10-19 / 20
> 依据：156/157/159 三台主机的实测数据（进程内存、内核版本、运行时版本、端口表、配置耦合度、数据体积），非理论推演。

---

## 0. 结论先行

**技术上可行，但当前硬件与软件栈下，「全量 K8S 化」的投入产出比很差。我建议走「分层渐进」路线。**

三条结论：

1. **别一上来就 K8S。** 156 是 1 核 / 可用内存 190M / 磁盘剩 1.3G，157 是 **CentOS 6.10 + 内核 2.6.32**（K8S 完全不支持）。现有三台机器加起来 5 核 8G，而 K8S 自身（kubelet + containerd + CNI + etcd）在每个节点就要吃掉 1~1.5G。**不换硬件，K8S 跑不起来。**

2. **真正的收益在「无状态业务层」**（cc-server-in、socket-push、webim、yy-server、report、nginx），这些是普通 HTTP 服务，容器化收益明确：部署一致、可回滚、可横向扩。
   **媒体层（Asterisk / clpms）上 K8S 收益最低、风险最高**——它要固定 UDP 端口、要 RTP 大端口段、要稳定的对外 IP，而 K8S 恰恰最不擅长这些。

3. **前置治理的价值高于迁移本身。** 现在 156 根分区 96%、1.3G 可用、swap 已用 617M，还有 `-Xmx2048M` 的 Java 在抢内存——这套系统随时可能 OOM。先把它治稳，比迁到 K8S 更能解决你的实际问题。

---

## 1. 现状盘点（改造的起点）

### 1.1 硬件与 OS

| 机 | OS | 内核 | CPU | 内存 | 磁盘 | 容器运行时 |
|---|---|---|---|---|---|---|
| **156** | CentOS 7.9 | 3.10.0-1160 | **1 核** | 2.8G，**可用 190M**，swap 已用 617M | 26G，**已用 96%，剩 1.3G** | docker（无 containerd 列出） |
| **157** | **CentOS 6.10** | **2.6.32-754** | 1 核 | 2.2G，可用 951M | 27G，52% | **无** |
| **159** | CentOS 7.9 | 3.10.0-1160 | 2 核 | 2.8G，可用 1.3G | 47G，82% | **Docker 26.1.4**（已跑 Dify 10 个容器） |

**判定**：
- K8S 官方最低要求：控制平面 2C/2G，节点 1C/1G。实际生产（含 CNI、监控、日志）建议 4C/8G 起步。
- **157 的内核 2.6.32 直接判死** —— K8S 要求的 cgroup、namespace、iptables（nat 表）、overlayfs 在 2.6.32 上要么缺失要么行为不一致。CentOS 6 已于 2020-11 EOL。
- 156/159 的 3.10 内核可以跑 K8S（很多老集群就是 CentOS 7.9），但 cgroup 仍是 **v1**（实测 `stat -fc %T /sys/fs/cgroup` = tmpfs），而 K8S 1.31+ 已逐步弃用 cgroup v1。建议用 **K8S 1.28~1.30** 这个仍完整支持 cgroup v1 的区间，或先升 OS 到 Rocky/AlmaLinux 8/9。

### 1.2 运行时版本（决定基础镜像能不能拉到）

| 组件 | 版本 | 状态 | 容器化影响 |
|---|---|---|---|
| **Asterisk** | **1.4.44**（2012 年 EOL） | 已停维护 14 年 | 只能用 CentOS 6/7 老基础镜像自建；无法升级（dialplan 是 chan_sip + AEL 1.4 语法） |
| **Node.js** | **v6.10.0**（`/opt/node/bin/node`） | 2017 EOL | `node:6` 官方镜像已归档，需自建或用归档镜像 |
| **Java（多数服务）** | **1.6.0_41**（`cc-java-in`、`yy-java`、`cccdr`、156 的 `ass`） | 2013 EOL | **Docker Hub 无官方 java:6**，须自建镜像 |
| **Java（部分）** | jdk1.8.0_77（`cc-doc`、`assign-java`、157 的 ES/Tomcat/`report-java`） | 2016 | `openjdk:8` 有官方镜像，但小版本需对齐 |
| **Tomcat** | 8.0.53 | 2018 EOL | 可容器化 |
| **Consul** | 3 节点（156/157/159），leader=157 | 可用 | 与 K8S DNS 功能重叠，需二选一 |

**最麻烦的是 Java 6**。156 上有 4 个服务跑在 `java-1.6.0-openjdk-1.6.0.41`，官方仓库早已删除，只能从归档源（如 `archive.kernel.org` 或第三方）拿 RPM 自建镜像。而且这些 jar 是第三方交付的，本地源码树里不一定有源码（`cc-java-in.jar` 就是 jar 形态），**无法重新编译，只能"运行时 + 已有产物"打包**。

### 1.3 端口表（Service / 网络方案依据）

实测 159 的监听：

| 端口 | 进程 | 协议 | 说明 |
|---|---|---|---|
| **6030~6039** | asterisk ×10 | TCP | AMI 管理接口（注意：不是 5038） |
| **6060~6069** | asterisk ×10 | **UDP** | SIP 信令，`gz.ydx.159.0`~`.9` |
| 5072 | asterisk(gateway) | **UDP** | 出局网关 SIP |
| **10000~10005** | asterisk | **UDP** | **RTP 端口范围（见下方告警）** |
| 5066 / 5073 / 5074 / 7443 / 7690 | clpms(FreeSWITCH) | TCP/UDP | 含 SIP 与 RTP |
| 80 / 443 / 8000 / 8001 / 8002 / 8081 / 17789 | nginx | TCP | 门户 |
| 8300~8302 / 8400 | consul | TCP | 服务发现 |
| 7001 / 7002 / 7680 / 7787 | java(ass) | TCP | ASS 状态服务 |
| 7891 | ass | TCP | **AGI（dialplan 85 处依赖）** |

> ⚠️ **迁移前必须先修的问题**：`rtp.conf` 里 `rtpstart=10000` / `rtpend=10005` —— **RTP 端口只有 6 个**。每路通话占 RTP + RTCP 两个端口，这意味着 **159.0 实例理论并发上限只有 3 路**。这个值和"生产系统"的预期严重不符，要么是配置错误，要么并发能力一直被压着。**上 K8S 之前先把它查清楚改对**，否则迁完还是 3 路并发。

### 1.4 配置耦合度（改造工作量指标）

- `/etc/asterisk` 下 **124 个文件**含硬编码 `192.168.x`，其中 `192.168.1.159` 出现 **91 次**、`192.168.1.20` 出现 48 次。
- `cc-server-in/serverConfig.json` 硬编码 10+ 处：`192.168.1.156:5004`、`192.168.1.156:3000`、`192.168.1.156:17777`、`192.168.1.156:180`、`192.168.1.156:6000`、`127.0.0.1:9999`、`172.42.38.22:7700`、`172.42.38.30:8080`、`10.122.64.86:7777/7778`（微信/邮件服务）。
- `yy-server/serverConfig.json` 3 处（`192.168.1.156:80`、`156:8002`、`192.168.1.157`）。
- **Consul 服务发现**：`config.ccServerUrl = consulClient.remoteUrl('cc-server-in','')` —— 地址来自 Consul，不是配置文件。

**这是改造工作量的大头**：所有 IP 必须改成环境变量（ConfigMap/Secret）或 K8S Service DNS。

### 1.5 存储（PVC 规划）

| 路径 | 主机 | 体积 | 类型 | PVC 策略 |
|---|---|---|---|---|
| `/var/lib/mongo` | 156 | **985M** | 数据库 | StatefulSet + PVC（RWO） |
| `/opt1` | 156 | **5.8G**（含大量备份 `.tar.gz`） | 程序+备份 | 拆分：程序进镜像，备份清掉 |
| `/var/log` | 156 | **1.6G** | 日志 | **不进 PV**，走 stdout + 日志采集 |
| `/data` | 156 | 865M | 客户附件 | PVC（RWX，若多副本） |
| `/data/clpms` | 159/157 | 167M | FreeSWITCH | PVC |
| `/var/lib/asterisk/sounds` | 159 | 40M | 语音文件 | PVC 或镜像内置（只读） |
| `/etc/asterisk` | 159 | 6.5M | 配置 | **ConfigMap**（关键，见 §3.4） |
| `/var/spool/asterisk/*/monitor` | 159 | **32K** | 录音 | PVC（RWX）—— 目前几乎没录音 |
| ES 数据 | 157 | **~90KB**（3 个索引） | 检索 | 数据量极小，可重建 |
| Redis | 156 | `appendonly.aof` **0 字节** | 缓存 | 未持久化，纯缓存 |

---

## 2. 五个硬阻塞点

### 阻塞点 1：硬件与 OS —— 不换机器免谈

| 问题 | 证据 | 解法 |
|---|---|---|
| 156 资源枯竭 | 1 核、可用 190M、swap 617M、磁盘剩 1.3G | 先清盘（`/opt1` 5.8G 备份、`/var/log` 1.6G）再谈 |
| 157 内核 2.6.32 | CentOS 6.10 | **必须先升 OS**（Rocky 8/9 或 AlmaLinux 8），否则这台永远进不了 K8S |
| 159 已被 Dify 占用 | 10 个容器 + dockerd 53MB | 要么独立新集群，要么给 159 扩容 |
| 总算力不足 | 3 台合计 5 核 8G，还要跑 10+ Java | 至少要 3 节点 × 4C8G（见 §6） |

### 阻塞点 2：Asterisk 的网络 —— 最难的一关

三个具体难点：

**(a) 固定 UDP 端口**：11 个 Asterisk 实例各绑一个固定 SIP 端口（6060~6069 + 5072）。
- K8S Service 的 `NodePort` 默认范围 30000-32767，且**对 UDP 的支持和会话保持不如 TCP 可靠**；
- 更麻烦的是：SIP 客户端（MicroSIP/话机）在配置里写死 `192.168.1.159:6060`，**迁移后端口不能变**，否则全网点话机要重配。
- **可行解**：`hostNetwork: true` + `dnsPolicy: ClusterFirstWithHostNet`，让 Pod 直接用宿主机网络栈，端口保持不变。代价是失去网络隔离、每节点只能跑一个实例（端口冲突）。

**(b) RTP 端口段要暴露**：RTP 是动态端口（10000-10005 / 或改造后 10000-20000），且**必须在 SDP 里声明真实可达的 IP:Port**。
- 如果走 NodePort，SDP 里写的是 Pod IP，客户端打不通 → 必须设 `externip` 为宿主机 IP，且 NAT 要正确。
- `hostNetwork` 下这个问题自动消失（Pod IP = 宿主机 IP）。

**(c) NAT 与 externip**：
```
gz.ydx.159.0/sip.conf:  externhost=www.pbx159.com   ← 这个域名现在解析不到（历史遗留）
gateway/sip.conf:       externip=192.168.1.159
                        localnet=192.168.1.0/255.255.255.0
                        nat=yes
```
容器化后 Pod IP 会变，SDP/Contact 头里的 IP 必须能被客户端路由到 —— **这是 SIP 容器化的经典坑**。`hostNetwork` 是最省事的解法。

**我的建议**：Asterisk 用 **DaemonSet + hostNetwork**（每台媒体节点一个 Pod），或干脆**留在 VM 不迁**。

### 阻塞点 3：软件版本过老

- Asterisk **1.4.44**、Node **v6.10.0**、Java **1.6.0_41** —— 三个都 EOL 十年以上。
- 容器化时**无法升级**（dialplan 是 1.4 的 AEL 语法、chan_sip；node 6 的代码用了 `--debug-port` 等老参数；Java 6 的 jar 无法在 Java 8+ 保证兼容）。
- 结果：镜像必须**自建老运行时**，体积大、无安全更新、扫描一堆 CVE。
- **这不是 K8S 能解决的问题**，反而会因为"要造老镜像"而放大工作量。

### 阻塞点 4：配置硬编码与服务发现

- 124 个 Asterisk 文件 + 多个 `serverConfig.json` 硬编码 IP。
- Consul 与 K8S DNS 功能重叠，存在三种选择：
  1. **保留 Consul**（改动最小，Consul 也可跑在 K8S 里）
  2. **切 K8S Service DNS**（需改 `appConfig/lib/config.js` 的 `consulClient.remoteUrl()` 调用）
  3. **Consul + K8S 共存**（Consul 只做 KV，服务发现交给 K8S）
- 我倾向 **方案 1 起步**（先保留 Consul，降低风险），稳定后再评估切 DNS。

### 阻塞点 5：有状态与共享存储

- **录音文件**需要多实例共享（坐席在 A 实例接的电话，网页要能播放录音）→ 需要 **RWX 存储**（NFS / CephFS / 云厂商 NAS）。这是 K8S 里相对昂贵的部分。
- **租户配置**（`/etc/asterisk/.../accounts/*`）是**动态生成**的（云客服页面改 IVR → 写回 `.ael` 文件 → `reload`）。如果放 ConfigMap，**页面改配置会失效**。必须放 **PVC**（RWX，多个 Asterisk 实例共享）并保留 `reload` 机制。
- Mongo 需要**副本集**（现在是非副本集单点）→ StatefulSet + PVC，且要改连接串。

---

## 3. 服务分类：什么能迁，什么别动

### A 类：直接可容器化（无状态，收益最高）

| 服务 | 主机 | 内存 | 说明 |
|---|---|---|---|
| `cc-server-in`（3000） | 156 | 116 MB | Node 6，HTTP，配置外置即可 |
| `cc-server-out`（13001） | 156 | 67 MB | 同上 |
| `cc-socket-push`（5004） | 156 | 23 MB | socket.io，注意长连接与 session 亲和 |
| `webim` / `im-node` | 156 | — | IM，同上 |
| `yy-server`（3000） | 157 | 103 MB | Node 6，计费跳转逻辑 |
| `report-node` | 157 | 34 MB | 报表（注：`/report` 当前超时需先修） |
| `nginx` | 全部 | — | 直接换 **Ingress**（ingress-nginx / traefik） |
| `ucenter` | 157 | — | 静态 + Node |

### B 类：可容器化但要改（有状态或需配置改造）

| 服务 | 难点 | 建议 |
|---|---|---|
| `cc-java-in`（9999） | Java 6，jar 无源码 | 自建 openjdk6 镜像，配置 IP → 环境变量 |
| `cc-java-out` | `-Xmx2048M`，实际 RSS 473MB | **先把堆降到 512M**（156 内存告急主因），再容器化 |
| `assign-java` | `-Xmx2048M`，RSS 477MB | 同上 |
| `ass`（AGI 7891） | Java 6，**dialplan 85 处同步依赖** | 与 Asterisk 同节点部署，或 hostNetwork |
| `MongoDB`（27017） | 985M，非副本集 | StatefulSet + PVC，顺带改成副本集（补上现在的单点缺陷） |
| `Redis` | AOF 0 字节（纯缓存） | StatefulSet 或直接托管 Redis，无需迁移数据 |
| `MySQL` | 45MB | 数据量小，StatefulSet |
| `ES`（157） | 数据仅 ~90KB | **直接重建**，不迁数据 |
| `Solr`（18190） | — | 评估是否真在用（ES 几乎空，Solr 可能同理） |

### C 类：建议不动或最后动（媒体层）

| 服务 | 原因 |
|---|---|
| **Asterisk ×11** | 固定 UDP 端口 + RTP 段 + NAT，`hostNetwork` 可迁但收益低、风险高 |
| **clpms（FreeSWITCH）** | 同左，且是外呼最后一跳，动错了直接影响出局 |
| **aliAsrServer / aliTtsServer** | 依赖外网 + Java，可容器化但优先级低 |
| **asteriskGuard** | 本就只监控不重启，迁到 K8S 后应**直接删除**，用 K8S 的 livenessProbe 替代 |

---

## 4. 三阶段迁移路线

### 阶段 0：前置治理（1~2 周，**强烈建议先做**）

不碰 K8S，先把系统治稳。这一步的收益大于后面所有阶段。

| 项 | 动作 | 收益 |
|---|---|---|
| 156 磁盘 | 清 `/opt1/*.tar.gz` 备份、`/var/log`（1.6G） | 96% → <60% |
| Java 堆 | `cc-java-out`、`assign-java` 的 `-Xmx2048M` → **512M** | 释放 ~3G 虚拟内存压力，消除 OOM 风险 |
| 自启动 | 156 加 rc.local / systemd（现在重启就瘫） | 消除最大运维风险 |
| 看门狗 | 恢复 `ass_monitor.sh` cron（已被注释 3 年） | 进程挂了能自愈 |
| RTP 端口 | 核实 `rtpend=10005`，按并发量改大 | 解除 3 路并发上限 |
| trunk | 加 `qualify=yes`（现在全 Unmonitored） | 故障可检测 |
| 157 OS | 升级 CentOS 6.10 → Rocky 8/9 | 否则这台永远无法入集群 |

**验收**：156 可用内存 > 800M、磁盘 < 70%、重启后服务自恢复。

### 阶段 1：Docker 化（2~3 周，**不碰 K8S**）

目标：**解决"部署可重现"**，同时验证老运行时能不能装进镜像。

- 为 A 类服务各写 `Dockerfile`（基础镜像：`centos:7` + 老运行时）
- 配置外置：所有 `serverConfig.json` 的 IP → 环境变量
- 分组用 **Docker Compose** 起（按现在的机器分组，不动网络模型）
- Asterisk / clpms **先不容器化**，保持 `hostNetwork` 等价的 `--network host`
- 建立镜像仓库（Harbor 或本地 registry）

**验收**：`docker compose up` 能完整起一套，业务功能回归通过（含跳转、呼叫、录音）。

> 这一步做完，你就已经拿到了 K8S 80% 的收益（部署一致、可回滚、可版本化），而风险极低。**如果时间有限，做到这里就可以停。**

### 阶段 2：K8S 化（4~8 周，需新硬件）

**前提**：至少 3 台 4C8G 的新节点（或把现有机器升配）。

顺序（先易后难，随时可停）：

1. **集群底座**：K8S 1.28~1.30（兼容 cgroup v1）+ Calico/Cilium + ingress-nginx + 存储类（NFS CSI 或 Longhorn）
2. **Ingress 替换 nginx**：把 80/443/8000/8002/8081 收敛到 Ingress
3. **A 类服务上 K8S**：Deployment + Service + ConfigMap，2 副本验证无状态
4. **有状态组件**：Mongo（StatefulSet + PVC + 改副本集）、Redis、MySQL
5. **B 类服务**：Java 6 服务逐个上（每个都要单独造镜像）
6. **媒体层（可选）**：Asterisk 用 `hostNetwork` DaemonSet 上，或保留在 VM

**每一步都可独立回滚**，因为 Ingress 后面可以同时挂 VM 和 Pod。

---

## 5. Asterisk 上 K8S：三种方案对比

| 方案 | 做法 | 优点 | 缺点 | 适用 |
|---|---|---|---|---|
| **① hostNetwork（推荐）** | `hostNetwork: true` + `dnsPolicy: ClusterFirstWithHostNet` | 端口 100% 不变、SDP 无需改、话机零改造、RTP 直通 | 无网络隔离、每节点只能一个实例（端口冲突）、失去 K8S 网络能力 | **当前最务实** |
| **② NodePort + externalTrafficPolicy=Local** | Service NodePort，改 `externip` 为宿主机 IP | 保留 CNI、可多副本 | UDP 会话保持弱；SIP Contact/VIA 头要改；端口范围受限；NAT 后 SDP 易错 | 小规模、可接受改造 |
| **③ Macvlan / Multus（SR-IOV）** | 给 Pod 分配二层真实 IP | 最接近物理机、性能好 | 需要 CNI 支持、网络运维复杂、云环境常受限 | 有专职网络团队 |

**我的建议**：Asterisk 走 **①**，并且**不追求多副本**（SIP 有状态，多副本要改注册共享，chan_sip 不支持——这我在高可用报告里论证过）。把"高可用"交给 K8S 的**节点级重建**（Pod 挂了在原地重建，IP 不变），而不是横向扩副本。

关键配置骨架：

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: asterisk-159-0
spec:
  selector:
    matchLabels: { app: asterisk, instance: "gz-ydx-159-0" }
  template:
    metadata:
      labels: { app: asterisk, instance: "gz-ydx-159-0" }
    spec:
      hostNetwork: true                          # 端口 6060 直接占用宿主机
      dnsPolicy: ClusterFirstWithHostNet         # 仍能用集群 DNS
      nodeSelector:
        role: media                              # 只在媒体节点跑
      containers:
      - name: asterisk
        image: registry.local/7moor/asterisk:1.4.44
        args: ["-g", "-C", "/etc/asterisk/gz.ydx.159.0/asterisk.conf"]
        securityContext:
          capabilities:
            add: ["SYS_NICE", "NET_BIND_SERVICE"]
        ports:
        - { containerPort: 6060, protocol: UDP, name: sip }
        - { containerPort: 6030, protocol: TCP, name: ami }
        volumeMounts:
        - { name: cfg,   mountPath: /etc/asterisk }        # RWX：页面改配置要写回
        - { name: rec,   mountPath: /var/spool/asterisk }  # RWX：录音共享
        - { name: sound, mountPath: /var/lib/asterisk/sounds, readOnly: true }
        livenessProbe:                                     # 替代 asteriskGuard
          exec:
            command: ["asterisk", "-C", "/etc/asterisk/gz.ydx.159.0/asterisk.conf",
                      "-rx", "core show uptime"]
          initialDelaySeconds: 30
          periodSeconds: 15
        resources:
          requests: { cpu: "100m", memory: "128Mi" }       # 实测 RSS 仅 13MB
          limits:   { cpu: "1000m", memory: "256Mi" }
      volumes:
      - name: cfg
        persistentVolumeClaim: { claimName: asterisk-cfg }   # StorageClass 需 RWX
      - name: rec
        persistentVolumeClaim: { claimName: asterisk-rec }
```

> 注意：`/etc/asterisk` 必须是 **RWX PVC**，因为云客服页面改 IVR 会写回 `.ael` 文件。用 ConfigMap 会导致页面改配置失效。

A 类业务的骨架（以 `cc-server-in` 为例）：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: cc-server-in }
spec:
  replicas: 2
  selector:
    matchLabels: { app: cc-server-in }
  template:
    spec:
      containers:
      - name: app
        image: registry.local/7moor/cc-server-in:node6
        ports: [{ containerPort: 3000 }]
        env:
        - { name: DB_HOST,     value: "mongo.cc.svc.cluster.local" }
        - { name: CC_JAVA_URL, value: "http://cc-java-in.cc.svc.cluster.local:9999/service" }
        - { name: PUSH_URL,    value: "http://cc-socket-push.cc.svc.cluster.local:5004" }
        - { name: YY_BILL_URL, value: "http://yy-server.cc.svc.cluster.local:3000/public" }
        envFrom:
        - configMapRef: { name: cc-server-in-config }
        - secretRef:    { name: cc-db-secret }      # 7moorcom 等口令移到这里
        readinessProbe:
          httpGet: { path: /health, port: 3000 }
        resources:
          requests: { cpu: "200m", memory: "256Mi" }
          limits:   { cpu: "1000m", memory: "512Mi" }
```

对应的改造：把 `serverConfig.json` 生成逻辑改成**启动时用环境变量渲染模板**（在 Dockerfile 的 entrypoint 里做，用 `envsubst` 或 Node 脚本），而不是改代码。

---

## 6. 硬件建议

| 方案 | 规格 | 说明 |
|---|---|---|
| **最小可用** | 3 节点 × 4C8G + 200G SSD | 3 控制平面复用为工作节点（允许 NoSchedule 去掉）；能跑下 A 类 + 有状态 |
| **推荐** | 3 控制平面 × 2C4G + 3 工作节点 × 8C16G | 控制面与业务分离；媒体节点单独标记 `role=media` |
| **媒体节点额外要求** | 固定 IP、RTP 端口段（10000-20000）可路由、1Gbps+ | Asterisk 走 hostNetwork，IP 不能漂移 |

存储：**至少一种 RWX StorageClass**（NFS CSI、Longhorn、CephFS 或云 NAS），用于录音与租户配置共享。

---

## 7. 工作量与风险

| 阶段 | 工作量（人天） | 主要风险 |
|---|---|---|
| 阶段 0 治理 | 5~8 | 低（但 RTP 端口改动需停机窗口） |
| 阶段 1 Docker 化 | 15~20 | 中：Java 6 / node 6 镜像难造；配置外置易漏 |
| 阶段 2.1~2.4（底座 + A类 + 有状态） | 20~30 | 中：Mongo 改副本集要改连接串 |
| 阶段 2.5（Java 6 服务） | 10~15 | 中高：jar 无源码，出问题难排查 |
| 阶段 2.6（媒体层，可选） | 15~25 | **高**：SIP/RTP 出问题直接影响通话 |
| **合计（不含媒体层）** | **50~73 人天** | |
| **合计（含媒体层）** | **65~98 人天** | |

### 风险清单

1. **老运行时无安全更新** —— Asterisk 1.4、Java 6、node 6 全是 EOL，镜像会有一堆 CVE；且**升级不了**（dialplan 与 jar 绑定）。
2. **jar 无源码** —— `cc-java-in.jar` 等只有产物，出问题只能靠日志，无法打补丁。
3. **SIP 容器化后话机要重配** —— 除非用 hostNetwork 保持端口/IP 不变；一旦 IP 变了，全网话机（6322 个分机）要重配，这是最大的落地阻力。
4. **租户配置写回** —— 若误用 ConfigMap，云客服页面改 IVR 会失效（页面看着成功，实际 dialplan 没变）。
5. **双跑期一致性** —— 迁移过程中 VM 与 Pod 并存，两边共享同一个 Mongo，要防止双写/配置漂移。
6. **收益可能被高估** —— 这套系统是**重打包的闭源交付**，不是自研微服务，K8S 带来的"研发效率提升"收益有限；真正能拿到的是"部署一致性"和"故障自愈"。

---

## 8. 我的建议（按优先级）

1. **立刻做阶段 0**：清盘、降 Java 堆、加自启动、修 RTP 端口。这一步不需要 K8S，解决的是你**当下最可能出故障**的问题（156 随时 OOM）。
2. **做阶段 1（Docker 化）**：拿到 80% 收益，风险可控。做完评估是否真需要 K8S。
3. **K8S 只上 A 类 + 有状态**：媒体层（Asterisk/clpms）**留在 VM**，用 hostNetwork 的思路保持 IP/端口不变。这不是妥协——SIP 媒体层放进 K8S 业界也很少有成功案例。
4. **157 必须升 OS**：CentOS 6.10 + 内核 2.6.32 是硬墙，绕不过去。
5. **如果目标是"高可用"而不是"K8S"**：那更应该做的是我在高可用报告里写的四件事——真分片、systemd 自愈、`qualify=yes`、数据层副本集。**K8S 不是高可用的必要条件。**

---

## 附录：本次采集的实测数据

| 数据 | 文件 |
|---|---|
| 159 进程/内存/Asterisk 实例/rc.local/硬编码 IP/端口表 | `D:\lwj\k1_159.txt`、`k4_ver.txt` |
| 156 进程/内存/启动脚本/配置 IP/资源 | `D:\lwj\k2_156.txt` |
| 157 进程/内存/ES 数据/OS 版本 | `D:\lwj\k3_157.txt` |

关联：`D:\lwj\云呼系统高可用评估报告.md`、`D:\lwj\云呼系统业务功能全景分析.md`
