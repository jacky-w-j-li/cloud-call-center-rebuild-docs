# 云呼系统 Java 17 编译实测报告

> ⚠️ **环境口径**：本报告涉及的 192.168.1.156 / 157 / 158 / 159 均为**本机 VMware 虚拟机（测试/验证环境）**，**不是生产系统**。
> 文中实测数据、规模数字、配置现状都来自该测试环境，不代表真实生产规模与规范。


> 日期：2026-10-20
> 目的：验证《云呼系统 AWS 迁移与全面升级评估》中"Java 6 → 现代 JDK"这条路径是否真的走得通
> 方式：本机实机编译 + 打包 + 启动，不靠推断
> 结论：**14 个工程、1872 个源文件，在 JDK 17 下 100% 编译通过；report-java 实测可启动运行**

---

## 一、结论先行

| 项目 | 评估报告原估 | 本次实测 |
|---|---|---|
| Java 升级可行性 | 20~40 人天（含"无源码"风险） | **编译适配部分约 1.5 人天**（21 个文件、~20 处改动） |
| 阻塞项 | 预判 `sun.*` 内部类、`javax.xml.bind` | **`javax.xml.bind` 未使用**（预判正确）；`sun.*` 仅 5 类，全部机械可修 |
| 第一个工程 | — | report-java：112 文件 → 7 错误 → 4 处修复 → 编译 + 打包 + JDK17 启动成功 |

**核心判断：Java 侧不是迁移的障碍。** 真正的成本不在"能不能编译"，而在：
1. 老第三方依赖（jedis 2.8.1 / mongo-driver 3.0.4 / POI 3.12 / Lucene 3.4 / XStream 1.3.1）的**运行时**行为与升级
2. 业务回归测试（见第六节 3 个必须回归点）
3. `cc-ass`（1186 文件，OSGi/Equinox）**本次未覆盖**，是唯一真正的未知数

---

## 二、环境与工具链

| 项 | 值 |
|---|---|
| JDK | Amazon Corretto **17.0.12**（`D:\Backup\Users\amyren\.jdks\corretto-17.0.12`） |
| 备用 JDK | IDEA JBR 17.0.11（`D:\idea\ideaIU-2024.1.4.win\jbr`）。**本机无 JDK 21** |
| 构建 | 本机无 Ant，用等价 `javac` 命令复现 `build.xml` 的 compile/jar 两个 target |
| 产物字节码 | `major version 61` = Java 17 |
| 回退选项 | `--release 8` 对 report-java 同样通过（见 3.4），可产出 Java 8 可运行字节码 |

### 两个实际踩到的坑（工具层面）

1. **本机 PATH 无 java**：需用绝对路径调用 `javac.exe`。
2. **MANIFEST.MF 单行 ≤72 字节**：直接拼 `Class-Path` 会报 `java.io.IOException: line too long`。必须按规范折行（续行以单个空格开头）。这是 `jar cfm` 的硬性限制，Ant 会自动处理、手写不会。

---

## 三、试点：report-java 完整闭环

### 3.1 编译

```
112 个源文件 → 7 个错误 → 全部集中在 Main.java 一个文件
```

`Main.java` 是孤立的 AES/DES 加密实验类（默认包、非入口；真正 Main-Class 是 `com.dishui.service.AppServiceStartUp`）。
已验证 `com` 包下**零引用** `Main` → 死代码，可安全替换。

### 3.2 唯一的问题：JDK 9+ 移除 `sun.misc.BASE64*`

```java
// 改前（JDK 6 写法）
import sun.misc.BASE64Decoder;
import sun.misc.BASE64Encoder;
import sun.security.krb5.internal.crypto.Aes128;   // java.security.jgss 未导出
String strs = new BASE64Encoder().encode(bt);

// 改后（JDK 8+ 标准 API，用全限定名避开与 commons-codec 的 Base64 重名）
String strs = java.util.Base64.getEncoder().encodeToString(bt);
byte[] buf  = java.util.Base64.getDecoder().decode(data);
```

修改 4 处，原文件已备份为 `src/Main.java.bak.20261020`。

### 3.3 打包 + JDK 17 实机启动

```
javac -encoding UTF-8 -d build_jdk17 -cp "lib/*" @sources.txt     → exit 0，140 个 class
jar cfm report-java-jdk17.jar <折行后的 manifest> -C build_jdk17 . → 19,984,441 字节（原生产 jar 19,932,344）
java -jar report-java-jdk17.jar <basedir>                          → 启动成功
```

启动日志关键行（**stderr 零输出**）：

```
Java version: 17.0.12          Java vendor: Amazon.com Inc.
Loading [server.conf] → Load configuration from [server.conf]
Starting DB plugin...
Connecting to db: 172.42.38.42:7211
DB connected / DB app connected
MailReportHandler thread 1..10 start
```

**说明什么**：自定义 IoC 容器、日志系统、Mongo 驱动 3.0.4、线程池全部在 JDK 17 上正常初始化。
后续 `No server chosen by ReadPreferenceServerSelector ... 172.42.38.42:7211` 是**本机连不到生产内网**（网络问题），不是 JDK 问题。

### 3.4 兼容性回退验证

```
javac --release 8 ... → exit 0
```

意味着同一份源码可产出 Java 8 可运行的字节码，支持"先升编译、后升运行时"的渐进路线。

---

## 四、全量扫描结果（14 个工程）

批量脚本：`D:\lwj\workspace\_compile_r2.cjs`（classpath 显式构造 + 错误采集）

| 工程 | 源文件 | 首轮 | 最终 | 说明 |
|---|---|---|---|---|
| report-java | 112 | ✗ | ✅ | 改 `sun.misc.BASE64` |
| cc-java-in | 216 | ✗ | ✅ | 云客服核心 |
| cc-java-in-l | 210 | ✗ | ✅ | |
| cc-java-out | 174 | ✗ | ✅ | 云电销 |
| cc-cdr | 126 | ✗ | ✅ | |
| yy-java-bill | 290 | ✗ | ✅ | 计费（**唯一真实代码改造**） |
| yy-java-timer | 122 | ✗ | ✅ | `--add-exports` 通过 |
| sms_java | 186 | ✗ | ✅ | 排除 26 个 `._*.jar` 后即通过 |
| cc-doc-gddx | 118 | ✅ | ✅ | 一次通过 |
| robot-java | 112 | ✅ | ✅ | 一次通过 |
| sms-java-gddx | 107 | ✅ | ✅ | 一次通过 |
| gwcdr | 73 | ✅ | ✅ | 一次通过 |
| asteriskGuard | 21 | ✅ | ✅ | 一次通过 |
| m7consul | 5 | ✅ | ✅ | 一次通过 |
| **合计** | **1872** | **7✗** | **14✅** | |

---

## 五、5 类问题与修法（全部机械可修）

### 类型 1：`sun.misc.BASE64Encoder/Decoder`（JDK 9 移除）
- 影响：report-java、cc-cdr、cc-java-in、cc-java-in-l
- 修法：换 `java.util.Base64`。其中多数是**未使用的残留 import**，直接删除即可（零行为变更）

### 类型 2：`sun.misc.Regexp`（JDK 9 移除）
- 影响：cc-java-in、cc-java-in-l 的 `DidiLinkRateTask.java`
- 修法：只有 import、代码中未使用 → 删除

### 类型 3：`java.lang.Record` 与 POI `Record` 撞名（JDK 16+）
```
错误: 对Record的引用不明确
  org.apache.poi.hssf.record 中的类 Record 和 java.lang 中的类 Record 都匹配
```
- 根因：源码用 `import org.apache.poi.hssf.record.*`（**按需导入**），而 `java.lang.*` 是隐式按需导入 → 两者平级，JDK 16 引入 `java.lang.Record` 后产生歧义
- 修法：**加一行显式 import**（显式导入优先于按需导入），每个文件 1 行
  ```java
  import org.apache.poi.hssf.record.*;
  import org.apache.poi.hssf.record.Record;   // ← 新增
  ```
- 影响：cc-java-in / -l / -out 共 9 个 Excel 处理类

### 类型 4：`com.sun.org.apache.xpath.internal.operations.Bool` 误导入
- 影响：cc-java-in、cc-java-in-l 的 `QualityCheckListExport.java`
- 性质：**IDE 自动导入的 mistake**——代码里用的全是 `java.lang.Boolean`，`import` 的却是内部类 `Bool`
- 修法：删除该 import，零行为变更

### 类型 5：`sun.net.ftp.FtpClient` —— **唯一需要真实改造的项**
这是全量扫描中**唯一**不是"改 import"能解决的问题，值得单独说：

| | yy-java-bill（369 行） | yy-java-timer（505 行） |
|---|---|---|
| API 世代 | **JDK 6 老 API**：`new FtpClient()` / `connectServer()` / `closeServer()` | **JDK 7+ 新 API**：`FtpClient.create()` / `connect()` / `login()` / `putFileStream()` |
| JDK 17 编译 | ❌ | ✅ |

**关键发现：同一个项目里已经存在 JDK 7+ 版本的现成实现。** 两版公开方法签名一致（`connectServer` / `upload` / `getFileList` / `closeServer`），而 `yy-java-bill` 的唯一调用方 `checkCdr.java:173` 只用到这 5 个方法 → **直接复用 timer 版本即可**，原文件已备份为 `FtpUtil.java.bak.20261020`。

⚠️ 但 `yy-java-timer` 是加 `--add-exports java.base/sun.net.ftp=ALL-UNNAMED` 才编译通过的，这仍是**内部 API**。
**正解（建议列入计划）**：换 Apache Commons Net `FTPClient`，约 0.5 人天 + FTP 上传/下载回归测试。本机目前无 commons-net jar。

### 附带发现（非 JDK 问题）
`sms_java/lib` 下有 **26 个 `._*.jar`**（macOS AppleDouble 元数据文件，从 Mac 拷贝源码时带入），不是真 jar，javac 报 `zip END header not found`。编译脚本已在 classpath 中排除（**未删除文件**），建议清理。

---

## 六、风险与遗留（必须处理）

### 1. ⚠️ 行为变更：Base64 换行差异 —— 必须回归阿里云 ASR 签名
`sun.misc.BASE64Encoder.encode()` **每 76 字符插入一个 `\n`**；`java.util.Base64.getEncoder()` **不换行**。

受影响的是 `cc-cdr/src/com/m7/cc/record_recognize/HttpUtil.java`，用途是**阿里云 ASR 的 MD5 + HMAC-SHA1 签名**。
新写法语义上更正确（签名本就不该含换行），但**必须实测一次语音识别接口**，确认服务端对新签名的接受情况。这是本次所有改动中风险最高的一处。

### 2. ⚠️ FtpUtil 换版本 —— 必须回归 FTP 推送
`yy-java-bill` 的 FTP 工具类整体换成了 timer 版本（505 行 vs 369 行，功能更丰富但实现不同）。上传/下载路径需实测，尤其是 `checkCdr` 的 CDR 文件推送。

### 3. ⚠️ 编译通过 ≠ 运行正确
老依赖在 JDK 17 上的**运行时**风险未验证：`XStream 1.3.1`（重度反射，JDK 16+ 强封装下易 `InaccessibleObjectException`）、`dom4j`、`Lucene 3.4`、`POI 3.12`、`jodconverter`（OpenOffice 桥接）。
好消息：report-java 实测启动正常（含 Mongo 驱动 3.0.4），但**其余 13 个工程尚未做 JDK 17 启动冒烟**。建议下一步逐个 `java -jar` 试跑，抓取 `InaccessibleObjectException` / `NoClassDefFoundError`。

### 4. ⚠️ cc-ass 未覆盖（唯一真正的未知数）
`D:\lwj\workspace\cc-ass\cc-ass\`（1186 个 java 文件）是 **Eclipse PDE / Equinox OSGi** 结构：40+ 个 bundle（`com.m7.cc.agi`、`com.m7.cc.ass.server`、…），无 `pom.xml` / `build.xml`，靠 `MANIFEST.MF` 的 `Import-Package` 声明依赖。
OSGi + JPMS 模块边界冲突是 Java 侧最难的部分，**需单独评估**（预估 5~10 人天）。本次未验证。

### 5. 源码版本对齐（阶段 -1）仍未做
源码齐全 ≠ 等于部署版本（此前已实测 157 的 yy-server 与本地 `自建/yy-server` 不一致）。上述编译用的都是本地源码树，**部署前必须逐个工程比对 SVN 版本 / 构建时间 / 关键类 diff**。

---

## 七、修正后的工作量估算

| 阶段 | 内容 | 原估 | 实测修正 |
|---|---|---|---|
| J1 编译适配 | 14 个工程 JDK 17 编译通过 | 含在 20~40 内 | **1.5 人天**（已完成） |
| J2 运行时冒烟 | 13 个工程逐个启动抓反射异常 | — | **3~5 人天** |
| J3 依赖升级 | jedis / mongo-driver / POI / Lucene / XStream | — | **5~8 人天** |
| J4 FTP 换 Commons Net + 回归 | 1 个类 + 上传下载验证 | — | **0.5~1 人天** |
| J5 cc-ass (OSGi) | 1186 文件，未评估 | — | **5~10 人天（待评）** |
| J6 业务回归 | 含 ASR 签名、报表导出、CDR 推送 | — | **8~15 人天** |
| **合计** | | **20~40 人天** | **23~40 人天** |

> 总量没有明显下降，但**风险结构变了**：不再是"可能做不了"，而是"确定能做，成本主要在测试"。
> 原先担心的"无源码死结"已被彻底排除。

---

## 八、产出物清单

| 文件 | 说明 |
|---|---|
| `report-java/report-java-jdk17.jar` | JDK 17 编译打包产物（19.98 MB），已实测可启动 |
| `report-java/build_jdk17/` | 140 个 class（major version 61） |
| `report-java/run17.log` | JDK 17 启动日志（stderr 零输出） |
| `report-java/compile_jdk17.log` | 修复前的 7 个错误原始记录 |
| `workspace/_compile_r2.cjs` | 全量批量编译脚本（可复用） |
| `workspace/_compile_r2c.out` | 14 个工程最终编译结果 |
| `workspace/_fix_round1.cjs` / `_fix_round2.cjs` | 两轮批量修复脚本 |
| `*/src/**/*.bak.20261020` | 所有被修改文件的备份（21 个） |
