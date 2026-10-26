# 云呼系统 · 编译/验证 VM 环境探查

> ⚠️ **环境口径**：本报告涉及的 192.168.1.156 / 157 / 158 / 159 均为**本机 VMware 虚拟机（测试/验证环境）**，**不是生产系统**。
> 文中实测数据、规模数字、配置现状都来自该测试环境，不代表真实生产规模与规范。


> 接入方式：`ssh -p 8022 lwj@127.0.0.1`（用户 lwj），通过 paramiko 非交互登录成功。
> 探查时间：2026-08-15 00:48 (GMT+8)，全部为只读命令。

## 一、基本身份
| 项 | 值 |
|---|---|
| 主机名 | `lwj-VMware-Virtual-Platform` |
| 系统 | Ubuntu 26.04 LTS (Resolute Raccoon)，内核 7.0.0-29-generic |
| 虚拟化 | VMware（`systemd-detect-virt` = vmware） |
| 账号 | `lwj`（uid 1000，隶属 sudo/adm/lxd 等组） |
| 配置 | 2 vCPU（i7-10510U @1.80GHz）/ 3.3G RAM / 98G 盘（仅用 15G） |
| IP | `ens33` = 192.168.134.128/24；SSH 端口 8022 经主机端口转发暴露到 127.0.0.1:8022 |

## 二、这是「云呼系统通信层」的编译与补丁验证机
与 `D:\lwj` 下 `容联/`、`asterisk/`、`kamailio/` 等源码/参考树直接对应：

- **`~/asterisk`** —— Asterisk 完整源码树（含 `apps/ bridges/ build_tools/ res/` 等），即云呼通信核心。
- **`~/asterisk-master.zip`** —— Asterisk 源码包（9.9 MB）。
- **`~/astrun`** —— 已编译的 Asterisk 运行/验证目录：`modules/`、`etc/`、`var/`、`run_verify.sh`、`diag.sh`、`verify_result.txt`、`full_run.log`、`startup.log`、`diag.log`。说明在此机上**实际编译并跑过 Asterisk**。
- **`~/ari_verify.py`** —— 针对 **Asterisk PR #2084（issue #2044）** 的运行时验证脚本：修复"通道处于内部 HOLDING/dial bridge 时 `channels.record` 被错误拒绝"的问题（改 `res/res_stasis_recording.c`，允许在 HOLDING bridge 中录音）。用 PJSIP 回环（127.0.0.1:5060）+ 标准库 WebSocket 订阅 Stasis app `recordtest` 来复现场景。**这正是云呼"通话录音"功能所依赖的上游 Asterisk 能力**，用户疑似在向 Asterisk 上游提补丁。
- **`~/kamailio-6.0.zip` / `~/kamailio-6.0_src/`** —— Kamailio 6.0 源码（SIP 代理，云呼架构中的信令层）。
- **`~/build-pr4852`** —— CMake 构建目录（root 属主，含 `install_manifest.txt`），疑似 Kamailio 构建产物。
- **`~/hiredis-cluster-0.15.0.tar.gz`** —— Redis 集群客户端（云呼数据层依赖）。
- **`~/hgfs_lwj`** —— VMware 共享目录挂载点，**当前为空**（尚未把主机 `D:\lwj` 挂进来）。

## 三、当前运行状态（只读 `ps`/`ss`/`systemctl`）
- **仅 `nginx` 在跑**（systemd active），监听 `80 / 8080 / 8081` —— 极可能是云呼 Web 前端/反向代理。
- 其他监听端口：`7681`（疑似 ttyd 网页终端）、`8080/8081`、`22`（SSH）、`631`（打印）、`53`（systemd-resolved）。
- **Asterisk / Kamailio / consul / mongodb / redis 当前均未运行** —— 此机定位是"编译+验证"，不是生产运行机。

## 四、判断
`D:\lwj` 下的 `容联/*`、`asterisk/`、`kamailio/`、`freeswitch/`、`mrcp/` 等是**源码与参考/部署树**；
而这台 VM（`lwj-VMware`）是把其中 **Asterisk + Kamailio 实际编译、并向上游 Asterisk 验证/提交补丁（PR #2084 通话录音）** 的开发机。两者是同一系统"代码库 ↔ 构建验证机"的关系。

## 五、可选后续（需你确认再做）
1. 挂载 VMware 共享目录，把主机 `D:\lwj` 映射到 `~/hgfs_lwj`（`vmhgfs-fuse`），让 VM 直接读写源码树。
2. 在 VM 内实际编译/启动 Asterisk，跑 `ari_verify.py` 验证 PR #2084 补丁。
3. 编译并配置 Kamailio 6.0；用 nginx 反向代理打通云呼前端。
4. 继续只读排查：`astrun/verify_result.txt`、`startup.log` 看上次编译/验证结果。

> ⚠️ 安全提示：VM 内 `lwj` 属 sudo 组且 SSH 密码简单（lwj123456），建议仅用于本地 NAT，勿暴露到公网；本探查脚本 `tmp_read/ssh_probe*.py` 含明文密码，长期复用请改为密钥登录或把密码外置。

## 六、VMware 共享目录自动挂载（已修复，2026-08-15）
- 共享配置：主机 `C:\Users\amyren\lwj` → VM 共享名 `lwj`（`vmware-hgfsclient` 已确认）。
- **真实挂载点：`/mnt/hgfs/lwj`**（fstab 把 `.host:/` 挂到 `/mnt/hgfs`，`lwj` 作为子目录出现）。之前看到的 `~/hgfs_lwj`、`/mnt/lwj` 只是空占位目录，不是真实挂载点。
- 修复前：`mnt-hgfs.automount` / `mnt-hgfs.mount` 单元 `failed`，访问 `/mnt/hgfs/lwj` 报 `No such device` (ENODEV)。根因：Ubuntu 26.04 的 open-vm-tools 只装了 `/usr/bin/vmhgfs-fuse` 二进制，**缺 `mount.vmhgfs-fuse` 包装脚本**（fstab 类型 `fuse.vmhgfs-fuse` 需要助手 `/usr/sbin/mount.fuse.vmhgfs-fuse`）。
- 修复动作（持久，重启仍有效）：
  1. 写 `/usr/sbin/mount.vmhgfs-fuse` 包装脚本：把 device 占位 `vmhgfs-fuse` 翻译成 `.host:/`，并**过滤掉挂载层选项**（`nofail`/`_netdev`/`ro`/`rw`/`x-systemd.*` 等），只把 `allow_other,uid=0,gid=0` 传给 `vmhgfs-fuse`；
  2. 软链 `/usr/sbin/mount.fuse.vmhgfs-fuse -> /usr/sbin/mount.vmhgfs-fuse`；
  3. `systemctl daemon-reload && systemctl restart mnt-hgfs.automount`。
- 验证：`ls /mnt/hgfs/lwj` 正常列出主机目录内容；`mount` 显示 `vmhgfs-fuse on /mnt/hgfs type fuse.vmhgfs-fuse`。
- 提示：若想更顺手，可在 VM 内建软链 `ln -s /mnt/hgfs/lwj ~/lwj`（或指向 `~/hgfs_lwj`）作为快捷入口——按需添加，未自动做。
