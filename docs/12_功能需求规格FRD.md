# 12 · 功能需求规格（FRD）

> **本文是"照着做"的那一层**：每个模块的页面、字段、按钮、状态机、业务规则、接口动作名、权限点、验收要点。
> 与 11（用户手册）互补：11 讲"用户怎么点"，本文讲"开发要做什么"。
> 所有字段名取自测试环境前端模板与 Mongo 文档，可直接作为建表/建 DTO 的依据。

---

## 零、全局约定

### 0.1 页面标识

菜单树里每个叶子节点有 `page=` 值，即前端视图路径，如 `cdr/call_sheet` → `views/cdr/call_sheet.html` + `javascripts/cdr.js` 中的 handler。开发时**用 page 值作为路由标识**，保证菜单配置可驱动。

### 0.2 接口动作命名

所有前后端交互走 `action=xxx`（详见 `05_接口与协议.md`）。命名规律：

| 前缀 | 含义 | 例 |
|---|---|---|
| `<模块>.<功能>` | Node 侧 | `cdr.searchAllCallSheet`、`customer.exportCustomer` |
| `app.<模块>.<功能>` | 部分查询类 | `app.popup.popupCust`、`app.workbench.workbenchRefresh` |
| `config.<子域>.<功能>` | 配置类 | `config.ivr.reloadIvr`、`config.role.addRole` |
| CTI Action（大写） | 通话控制，走 `cti-action-monitor.js` | `Originate` `Hangup` `Transfer` `Consult` `Hold` `Busy` |

### 0.3 权限点

按钮级权限用 `funcId`，前端 `isHasFunc(funcId)` 判断是否渲染。已知权限点：`func_customer_delete`、`func_customer_export`、`func_customer_assign`、`func_submit_to_quality_check` 等。
角色授权两层：**数据权限**（8 模块 × 4 级范围）+ **功能权限**（zTree 勾选树）。

### 0.4 通用字段约定

| 约定 | 说明 |
|---|---|
| 时间 | Mongo 存时间戳/字符串，前端格式化；列表筛选用 `BEGIN_DATE/BEGIN_TIME/END_DATE/END_TIME` 四个入参 |
| 字典 | 下拉选项不硬编码，走 `getDicCache('callType')`、`getDicCache('callStatus')`；满意度走 `getCacheByKey('options','name','满意度调查选项')` |
| 自定义字段 | 客户与工单都支持，存为动态字段，渲染时按类型生成控件 |
| 导出 | 大数据量一律走"任务"模式：提交任务 → 后台生成文件 → 列表下载 |

---

## M1 · 登录与会话

### 功能点

| ID | 功能 | 说明 |
|---|---|---|
| M1-1 | 账号密码登录 | 账号 `工号@账号名`；密码 MD5（前端加盐 `getLoginUserSalt`） |
| M1-2 | 选择接听方式 | `Local`(手机) / `gateway`(话机) / `sip`(软终端)，随登录提交 |
| M1-3 | 邮箱验证码 | 二次校验，可重发 |
| M1-4 | 滑块拼图验证 | 账号异常时触发；运营后台为失败≥3次触发 |
| M1-5 | 记住密码 | 密码 MD5 存 localStorage（键 `sosdwarp`），不进 cookie |
| M1-6 | 登录状态预设 | 示忙/示闲，决定签入后是否可接 |
| M1-7 | 免密登录 | URL 带 `?sessionId=` / `?token=` / `?kf=` 直接进系统（第三方/计费跳转用） |
| M1-8 | 忘记密码 | 邮箱验证码 → 重置 |
| M1-9 | 顶号踢出 | 同工号异地登录，前者收 `Kick` 断开回登录页 |
| M1-10 | 绑定手机前置 | `bindPhoneBeforeLogin`，未绑手机强制绑定 |

### 字段定义

| 字段 | name | 类型 | 校验 | 来源 |
|---|---|---|---|---|
| 账号 | `loginName` | string | 必填，必须含 `@` | `login_template.html:12` |
| 密码 | `password` | string | 必填，MD5+盐 | `:15` |
| 接听方式 | `extenType` | enum | `Local`/`gateway`/`sip`，默认 `gateway` | `:17-42` |
| 邮箱验证码 | `authCode` | string | 条件必填 | `:45,71-72` |
| 记住密码 | `remember` | bool | 默认 true | `:49` |
| 登录状态 | `login_busyType` | bool | 默认 true | `:53` |

### 会话

- 主凭证 `session.id`（sid），每请求携带 `action.sessionId`
- Redis：`hmset APP_SESSION_PREFIX+_id` + `expire APP_SESSION_TIMEOUT_SECONDS`
- Cookie：`loginName`(30d)、`session`(1d)、`extenType`(30d)、`remember`(30d)、`rememberBusyType`(30d)

### 验收要点
- `8030@test` 能登录并进 489 租户；`8030`（不带 @）应报错
- 三种接听方式切换后 CTI 状态正确
- 异地登录触发踢出

---

## M2 · 坐席工作台与通话控制（CTI）

### M2-1 软电话条

**按钮清单与可见性矩阵**

| 按钮 | DOM id | CTI Action | 空闲 | 通话中 | 转接中 | 保持 | 咨询中 | 振铃/呼叫 |
|---|---|---|---|---|---|---|---|---|
| 外呼 | `dialoutEnable` | `Originate` | ✔ | | | | | ✔(呼叫中) |
| 挂机 | `hangupEnable` | `Hangup` | | ✔ | ✔ | | ✔ | ✔ |
| 保持 | `holdEnable` | `Hold` | | ✔ | ✔ | | | |
| 恢复 | `recoverEnable` | `Unhold` | | | | ✔ | | |
| 转接 | `transferEnable` | `Transfer` | | ✔ | ✔ | | | |
| 咨询 | `consultEnable` | `Consult` | | ✔ | ✔ | | | |
| 结束咨询 | `stopConsultEnable` | `StopConsult` | | | | | ✔ | |
| 咨询转接 | `consultTransferEnable` | `Transfer` | | | | | ✔ | |
| 咨询三方 | `consultThreeWayCallEnable` | `ThreeWayCall` | | | | | ✔ | |
| 三方 | `threewayEnable` | `ThreeWayCall` | | ✔ | | | | |
| 转IVR菜单 | `ivrMenuEnable` | `IvrMenu` | | ✔ | ✔ | | | |
| 转满意度 | `InvestigateEnable` | `Transfer` | | ✔ | ✔ | | | |
| 发短信 | `SmsEnable` | — | ✔ | ✔ | ✔ | ✔ | ✔ | |
| 通话标签 | `setCallLabel` | — | | ✔ | ✔ | | ✔ | |

**状态枚举**（持久化/推送用该数值）：

| 值 | 名称 | 值 | 名称 |
|---|---|---|---|
| 0 | 未连接 | 9 | 内部通话 |
| 1 | 空闲 | 10 | 外呼通话 |
| 2 | 呼叫中 | 11 | 监听中 |
| 3 | 内部呼叫中 | 12 | 转接振铃 |
| 4 | 来电振铃 | 13 | 转接拨号 |
| 5 | 内线振铃 | 14 | 转接通话 |
| 6 | 监听振铃 | 15 | 外呼转接通话 |
| 7 | 普通通话 | 99 | 系统置忙（后处理） |
| 8 | 三方通话 | — | hold（保持，独立态） |

**busyType 二次维度**：`0`=空闲、`忙碌`、`小休`、`99`=系统置忙。切换 Action `Busy`，成功写 `sessionStorage['phoneBarCurrentStatus']`。

**事件驱动**：CTI 走**长轮询** `_cti_waitEvent()` 循环 `Action: GetState`；解析 `PeerStatus`/`UserStatus`/`UserBusy`/`ChannelStatus(Ringing/Ring/Hangup)`/`Kick`/`Expired` 等事件更新状态机。

### M2-2 来电弹屏

| 项 | 规格 |
|---|---|
| 容器 | 左卡片列表 + 右客户详情 |
| **卡片上限 20**，超限剔除最旧 | `call.js:92` |
| 卡片字段 | 时间 `offeringTime`、来电号 `originCallNo`（脱敏）、归属地 `callerProvince/callerCity`、客户名（初始"定位中..."）、呼入服务号 `originCalledNo`、技能组 `queueName`、IVR 路径 `ivrkey` |
| 客户匹配 | 号码查客户：0 个 → 未知客户；1 个 → 直接展示；多个 → 弹多选定位 |
| 操作 | 看详情 `call.showCallDetail`、点号回呼 `softphonebar_dialout`、添加客户 `callAddCustomer`、定位 `call.popLocateSelected`、打开业务弹屏（内嵌/外跳） |
| 通知 | 右下角气泡 + HTML5 桌面通知 + 提示音 + 顶部菜单红点 |

**弹屏 URL 来源**：技能组上的 `BussinessTypeId`，或接口配置里的来电对接；可选开启 token（`token` + `tokenid`）。

### M2-3 工作台

| 区块 | 数据 | 计算口径 |
|---|---|---|
| 个人信息卡 | `session.user.displayName`、`exten`、邮箱、手机 | 点头像 `showEditInfo` |
| 呼入卡 | 接听数 / 总数 / 接听率 / 总时长 / 平均时长 | 当日、本人 |
| 外呼卡 | 接通数 / 总数 / 接通率 / 总时长 / 平均时长 | 当日、本人 |
| 联系计划 | `dateList`，按时距着色（≤1h 深橙，≤3h 浅橙） | |
| 客户统计 | `custStatusList`，按客户状态计数 | 点击跳转对应客户列表 |
| 工单处理 | 待领取 `busToClaim`、待处理 `busToDeal` | 点击跳工单列表 |
| 在线咨询占比 | 微信/网站/APP/微博 | 走报表服务 |

数据 Action：`app.workbench.workbenchRefresh`、`workbench.queryAgentWorkbenchReport`。
> 商机统计、商机券两块**已被注释**，重建时可选做。

---

## M3 · 通话记录与录音

### M3-1 列表（`cdr/call_sheet`）

**14 列**：定位客户、主叫号码、被叫号码、呼叫类型、处理状态、处理座席、呼入技能组、满意度、省份、城市、标记、呼叫时间、通话时长、操作。

**筛选项 = 查询入参**：

| 入参 | 控件 | 说明 |
|---|---|---|
| `BEGIN_DATE`/`BEGIN_TIME`/`END_DATE`/`END_TIME` | 日期+时间 | 呼叫时间区间 |
| `CALL_NO` / `CALLED_NO` | 文本 | 主叫/被叫 |
| `CONNECT_TYPE` | 下拉（字典 callType） | 呼叫类型 |
| `STATUS` | 下拉（字典 callStatus） | 处理状态 |
| `DISPOSAL_AGENT` | 坐席搜索 | 处理坐席 |
| `ERROR_MEMO` | 下拉 | 技能组 |
| `INVESTIGATE` | 下拉 | 满意度 |
| `CALL_TIME_LENGTH_BEGIN`/`END` | 数字 | 时长区间 |
| `KEY_TAG` | 全部/是/否 | 标记 |
| `CUSTOMER_NAME` | 全部/已定位/未知客户/多个匹配 | 定位客户 |

**操作**：查询 `cdr.searchAllCallSheet`、重置、导出清单 `cdr.exportCdrExcel`、**提交批量导出录音任务** `cdr.exportCdrMonitor`（≤1000 条/任务，次日 03:00 压缩）、详情 `cdr.showCdrDetail`、备注 `cdr.addCdrMemo`。

**"我的通话"**（`cdr/my_call_sheet`）：表头同；`DISPOSAL_AGENT` 隐藏并自动填当前坐席；处理状态下拉裁剪为 `''/dealing/notDeal`。

### M3-2 详情弹窗字段

定位客户、主叫、被叫、呼叫时间、摘机时间、通话时长、呼叫类型、处理状态、处理座席、省份、城市、标记、录音（播放器 + 下载）、备注。

操作：加入黑名单 `cdr.addCdrBlackList`、取消标记 `cdr.removeKeyTag`、提交质检 `cdr.submitCallSheetRecordToQC`、撤回质检 `cdr.revokeFromCallsSheetRecordQC`（已评分禁用）。

### M3-3 未接来电（`cdr/my_call_sheet_leak`）

| 元素 | 规格 |
|---|---|
| 子页 | 我的未接来电 / 全部 |
| 快捷筛选 | 全部/今天/昨天/近一周/近一月/近三月，`cdr.quickSearchMyLeakCard` |
| 关键字 | `QUICK_QUERY_NUM`，输入电话号码 |
| 高级搜索 | 回访座席 `CALLBACK_AGENT`、处理座席 `DISPOSAL_AGENT` |
| 行字段 | 状态、最近未接时间 `NEW_OFFERING_TIME`、**未接次数 `count`**、说明、客户名、回访座席、录音播放（默认隐藏） |

### 验收要点
- 录音能在线播放且能下载
- 批量导出任务超过 1000 条要提示
- 未接次数徽标正确累加

---

## M4 · 客户管理（CRM）

### M4-1 客户字段

| 字段 | name | 类型 | 说明 |
|---|---|---|---|
| 客户名称 | `name` | string | 默认"未知客户"，必填 |
| 客户状态 | `status` | enum | VIP/金牌/银牌/普通 + 8 个可扩展（承担"等级"角色） |
| 电话 | `tel[]` + `memo[]` | array | **可多条**，每条带备注；无独立"座机"字段 |
| 邮箱 | `email[]` + `eMemo[]` | array | 多条 |
| 微信 | `num[]` + `wxMemo[]` | array | 多条 |
| 省/市/区 | `province`/`city`/`district` | cascade | 三级联动 |
| 备注 / 地址 / 描述(职位) | `note`/`address`/`title` | text | |
| 性别 | `sex` | 0/1 | 男/女 |
| 生日 | `birth` | date | |
| 数据来源 | `custsource1` | 下拉 | |
| 归属 | `owner`/`category`/`categoryId` | 坐席搜索 | 按姓名/拼音/工号 |
| 网站 / 年龄 / 关联客户ID | `web`/`age`/`thirdPartyRelationId` | | |
| 附件 | file | | |

### M4-2 自定义字段

配置入口：设置 → 客户配置 → 客户模板 → 定制客户字段。

| 类型 | value | 备注 |
|---|---|---|
| 单行文本 | `single` | |
| 多行文本 | `multi` | |
| 数字 | `number` | |
| 日期 | `date` | |
| 下拉框 | `dropdown` | 可配选项 |
| 复选框 | `checkbox` | 可配选项 |
| 单选框 | `radio` | 可配选项 |

每个字段可设：**必填**、**禁止修改**、稳定字段可设**可查询**。

### M4-3 列表与批量操作

子页：我的客户 / 联系计划 / 全部。（"公海"入口当前被注释）

表头"更多"菜单：编辑 / 增加 / 合并 / 自定义快捷搜索 / 导出任务 / 撞单查询。

勾选后批量工具栏：

| 操作 | action | 权限点 |
|---|---|---|
| 全选 | `list_check_all` | |
| 删除 | `customer.showDelCustModal` | `func_customer_delete` |
| 导出 | `customer.exportCustomer` | `func_customer_export` |
| 分配 | `customer.showCustAssign` | `func_customer_assign` |
| 修改状态 | `customer.showBatchStatus` | |
| 转移客户 | `customer.showBatchCustomerCommon` | |
| 导出通话记录 | `customer.exportCustomerCdr` | |
| 提交批量录音下载任务 | `customer.addCustomerBatchMonitorTask` | |
| 取消联系计划 | `customer.showCancelPlanning` | |

单客户详情操作：编辑 / **占用** / **放弃**。
详情 Tab 4 个：联系计划 / 工单 / 联系历史 / 操作日志。
联系历史筛选类型：工单 / 联系计划 / 在线咨询 / 邮件 / 呼入 / 呼出。

### M4-4 导入

流程：选 Excel → 选客户数据库 → 客户状态 → 数据来源 → 所属人默认值（我自己/无归属）→ 导入批次 + 批次说明 → 关联关系 → 导入。提供模板下载。

### M4-5 联系计划（回访提醒）

| 元素 | 规格 |
|---|---|
| 字段 | 联系计划标题、完成标记、提醒时间 `notifyTime`（`notifyTime_date` + `notifyTime_time`） |
| 快捷选择 | 联系时间/半小时后/一小时后/明天/后天/三天后/2周后/30天后 |
| 保存 | `customer.saveCustAction` |
| 完成 | `customer.dealNote`，完成后自动切到"下一次联系计划" |
| 展示 | 列表项显示提醒时间徽标 |

### M4-6 公海（客户池）

| 配置项 | 说明 |
|---|---|
| 名称 / 管理员 / 成员 | |
| 类型 | 手动(3) / 自动(4) |
| 客户领取上限 | 默认 50 |
| **回收规则** | 待跟进 N 天无有效通话 → 自动回收；跟进中 N 天无完成联系计划或有效通话 → 自动回收 |
| 权限 | 仅管理员可转移公海客户 |

归属来源分类：无归属(1) / 主动领取公海(2) / 自动分配公海(3)。

### M4-7 外呼任务（`customer/task/task`）

| 元素 | 规格 |
|---|---|
| 新建 | 任务名称、描述、参与座席（可全选） |
| 详情 | 客户总数 / 已分配 / 待分配 / 导入 / 进度 / 分配 / 刷新 / 增加参与座席 |
| **自动回收** | 客户分配后未拨打状态达 N 天 → 自动回收到"待分配"池 |
| Tab | 拨打明细 / 成交明细 |
| 座席统计列 | 分配数量/未拨打/已接听/未接听/完成率/接听率 |
| 任务状态 | `dealing`=进行中、`close`=已关闭 |

---

## M5 · 工单（业务）

### M5-1 状态机模型（重点：不是固定枚举）

```
业务流程 flow ──包含──> 多个步骤 step（其中 1 个 isBegin=true）
       步骤 step ──包含──> 多个动作 action
       动作 action ──指定──> jumpTo（转移到哪个步骤）+ actionRole（谁能执行）
```

**历史动作语义**：

| action | 记录文案 |
|---|---|
| `create` | 创建工单！ |
| `transformIn` | 执行动作【动作名】状态变更为【步骤名】 |
| `backIn` | 执行动作【退回工单】状态变更为【步骤名】 |
| `recreate` | 重新提交工单！ |
| `comment` | 添加新的备注！ |
| `assign` | 变更工单处理人为【姓名/自动分配】 |

### M5-2 工单字段

| 字段 | name | 说明 |
|---|---|---|
| 工单类型 | `flow` | 选业务流程 |
| 关联客户 | `customer`（隐藏） | |
| 关联通话 | `callId`（隐藏） | 详情里可听录音 |
| 自定义业务字段 | 动态区 | |
| 下一步处理 | `nextAction` | |
| 处理人 | `nextUser` | 可含「自动分配」 |
| 工单编号 | `number` | 自动生成 |
| 创建人 | `createUser` | |
| 当前处理人 | `master` | |
| 附件 | 字段类型 `file` | |
| 时限 | 工单总时长 / 本步骤时长 | **详情页倒计时** |
| 流转记录 | 历史列表 | |

### M5-3 列表与操作

子页：待领取(`my_role_task_uncomplete`) / 我的工单(`my_task_uncomplete`) / 全部工单 / 我创建的 / 我参与的 / 已完成的 / 处理中的。

高级查询：创建人、客户名称、工单类型、当前处理人、工单步骤、工单编号、创建时间区间。

| 操作 | action | 说明 |
|---|---|---|
| 领取 | `business.setTaskToMe` | 待领取列表出现「领取」按钮 |
| 流转执行 | `business.excuteBusinessStepAction` | 系统步骤且无字段时自动执行 |
| 暂存 | `doSaveTempBusiness` | |
| 提交 | `doSaveBusiness` | |
| 退回 | `business.showBackBusinessTask` / `excuteBusinessBackAction` | |
| 改派 | 详情页改当前处理人 | |
| 打印 | | |
| 删除/导出 | `business.deleteBusiness` / `business.checkExportNum` | |

新工单提醒：`businessAssign` 推送「有新的待领取业务，请您及时处理！」。

### M5-4 流程配置（4 层）

见 `11` 手册 3.5；字段类型含：单行/多行/数字/日期时间/日期/时间/下拉级联/下拉树形/复选框/单选框/**附件**，可设「是否报表统计」。

---

## M6 · 短信

### M6-1 六个 Tab
我的短信 / 所有短信 / 群发短信 / 导入群发短信 / 短信模板查询 / 短信模板管理。

### M6-2 发送方式

| 方式 | 输入 | 限制 |
|---|---|---|
| 单发 | 号码 + 选模板 + 填变量 | 有「发送后关闭窗口」勾选 |
| 群发 | textarea 粘贴号码（英文逗号或回车分隔） | 建议 ≤3000 个 |
| 导入群发 | 建模板任务 → 传 xls → 按批次号查询 | |

仅**模板发送**启用（人工审核入口已注释）。

### M6-3 模板

| 项 | 规格 |
|---|---|
| 报备字段 | 签名 `signToCheck`、名称、内容 |
| **变量格式** | `{1}{2}{3}...{n}`，例「您的验证码是{1}」 |
| 发送时 | 按 `curTemplate.vars` 渲染"变量1/变量2"输入框 |
| 状态 | 待审 / 通过 / 不通过（显示原因，可"添加回复"沟通） |
| 操作 | 查看审核意见、删除、编辑、**停用**、**启用** |
| 查询条件 | 编号/名称/内容/变量个数/签名/创建时间 |

### M6-4 签名 / 通道 / 余额

| 概念 | 规格 |
|---|---|
| 签名 | 缓存 `smsSign`，含 `subcode` + `name`，发送时拼到内容前；查询条件里有签名下拉 |
| 通道 | 短信详情显示「通道状态」`by_errordescription`（**仅管理员可见**） |
| 余额 | 前端不展示余额；群发时后端校验，不足报「您账号的余额小于本次群发的金额！」（字段 `balance` + `overdraw`） |

### M6-5 发送记录

列：发送号码、发送座席、发送时间、**状态**、**拆分条数**、签名、**模板ID**、内容、操作（查看）。所有短信额外支持导出 Excel。
状态取字典 `smsStatus`；非管理员只看 `code_name_display`。
提示文案：提交后 5 分钟内送达；超过 N 字（含签名）后每 N 字记一条。

---

## M7 · 问卷

| 项 | 规格 |
|---|---|
| 模板类型 | 动态 `dynamic` / 静态 `static`，可停用启用 |
| 题型 | **仅单选（radio）与多选（checkbox）**；无填空/评分 |
| 多选配置 | 静态模板勾「是否是多选」`isMultiselect`；动态模板勾「开始问题」`isBegin` |
| 答案项 | 每项含答案 `answer` 与跳题 `next` |
| 备注 | 每题支持备注文本域 `other_{id}` |
| 问题字段 | 问题标识 `name`、问题内容 `context`、可插字段变量 |
| 问卷状态 | 5 个系统默认：`success`/`invalid`/`noAnswer`/`imparity`/`other` + 7 个可扩展 |
| 列表操作 | 分配 / 导出 / 删除 / 删除查询结果 |
| 分配规则 | 自动分配 / 重置（按座席配额） |
| 高级查询 | 名称/电话/创建时间/回访时间/分配状态(未分配·已分配)/当前处理人/问卷模板 |
| 详情 Tab | 问卷内容 / 联系历史；操作「点击呼叫」`questionnaire.clickDial` |
| **回访结果** | 回访成功 / 无效电话 / 无人接听 / 客户不配合 / 其他 |
| 稍后回访 | 同联系计划时间选择器 |
| 提交 | `questionnaire.completeTask` |

> ⚠️ **问卷与通话/满意度调查没有绑定关系**——满意度是 IVR 的独立节点（自定义满意度节点/自定义满意度选项），问卷走导入或外呼回访独立使用。

---

## M8 · 知识库

| 项 | 规格 |
|---|---|
| 结构 | 两个 Tab：内部知识库 / 外部知识库 |
| 目录 | 左侧树（`knowledge_tree`），支持新增/编辑/删除/排序 |
| 目录字段 | 所属目录（父级下拉）、目录名称、排序（同级值越大越靠前） |
| 条目字段 | 父目录、标题、**富文本内容（KindEditor）**、附件 |
| 附件 | ≤10MB，可删除 |
| 检索 | 关键词全文搜索（空格分词）+ 分页 |
| 最近更新 | `kmcontent.listRecently` |
| 详情 | 标题 / 发布时间 / 正文 / 附件下载 |
| **坐席侧使用** | 在线客服输入框「知识库搜索」按钮 → 弹窗（热门问题 + 结果），**点击可直接粘贴到对话框** |

---

## M9 · 在线咨询与邮件

### M9-1 在线咨询（`webchat`）

子页：待处理 / 全部。

| 功能 | action |
|---|---|
| 转接（座席） | `chat_transfer` → `transferAgent` |
| 转接（技能组） | `transferGroup` |
| 结束会话 | `webchat.endSession`（弹窗：确认 → **选对话分类** → 备注 → 确认 `closeSession`） |
| 抢接会话 | `webchat.webchatGrab` |
| 邀请 / 取消邀请 | `kickInvite` / `cancelInvite` |
| 发送消息 / 字号(12~20) / 表情 | `sendIframeMsg` / `changeImFontSize` / `showEmojiFaces` |
| 满意度（请求评价） | `webchat.pushImCSRInfo` |
| 知识库搜索 | `webchat.showKmPopover` |
| 发送链接 / 邮件 | `sendEmailIframe` |
| 加入黑名单 | `addBlackListBox` |
| **快捷回复** | Tab「辅助信息 / 快捷回复」下分**自定义 / 系统公用**；新增·编辑·删除·发送 |

### M9-2 邮件（`email`）

子页：处理中 / 全部。

| 功能 | action |
|---|---|
| 标记为…（下拉） | `showEmailMarkOptions` |
| 未读标记 | `setEmailReadMark` |
| 星标 / 取消星标 | `setEmailStarMark` |
| 完成 | `resolveEmail` |
| 添加抄送 | `addEmailCopy` |
| 回复 / 发送 | `replyEmail` |
| 备注（点击编辑） | `editEmailComment` |
| 快捷回复 | `saveQuickReply`（自定义 / 系统公用） |

**邮箱接入配置**（设置 → 渠道 → 邮箱）：邮箱账户名、密码、发件人名称、邮箱类型（下拉）、**收件服务器地址**（示例 `pop3.example.com`）、**发件服务器地址**（示例 `smtp.example.com`）、发件服务器端口、**邮件分发技能组**、是否默认。
> ⚠️ 前端只见到 POP3 示例，未见 IMAP 选项（类型由后端字典下发）。

### M9-3 推送机制（与 CTI 不同）

在线/邮件/工单/漏话等**走 socket.io**（`cc-socket-push`），不是 CTI 长轮询：

| 环节 | 规格 |
|---|---|
| 连接鉴权 | `query = {username:工号, password:md5, account, token: md5(token+"_&_"+exten+"_&_"+account)}` |
| 服务发现 | Consul 名 `cc-socket-push`，按连接数/权重选最闲节点 |
| 回执 | `socketId` 事件 → `app.push.pushSocketLogined` |
| 事件 | `NewWebchat`/`BatchNewWebchat`/`GroupMsg`/`NewNotify`/`NewEmail`/`ImMonitor`/`MailMonitor`/`IvrSoundTransferNotify`/`leakAssignMsg`/`customerPlan`/`quesNotify`/`saleChance`/`business`/`UbaNotify` |
| 断线补偿 | 重连后恢复 `chatStatus`/`emailStatus` 自动领取状态；`connect_error`>3 次重新拉地址 |

而**话机/来电事件走 CTI 长轮询**（`Action: GetState` 循环）。重建时两套都要有。

---

## M10 · 监控与质检

### M10-1 平台监控

| 区块 | 字段 |
|---|---|
| 当前并发 | `acc_concurrent` |
| 电话接入号监控 | 服务号码、今日外部来电数、今日未接外部来电数、今日已接外部来电数 |
| 多渠道接入监控 | 接入号码、今日会话数、今日已处理、今日完成 |
| 电话技能组监控 | 技能组名称、空闲座席数、签入座席数、**排队数（>0 标红）**、今日接通电话数 |
| 多渠道技能组监控 | 技能组名称、开启自动领取座席数、签入座席数、待领取会话数、接入会话数 |
| 外呼监控 | 今日外呼总数、今日外呼成功数 |
| **座席实时状态列表（17 列）** | 座席、工号、接听方式、状态、状态时长、外呼时长、技能组、客户号码、已接听数、外呼总数、外呼成功数、会话领取数、会话邀请数、当前会话数、在线会话领取、邮件会话领取、操作。前 4 列可排序 |

筛选：座席下拉、显示已选座席下级、状态下拉、**配置显示表头**（座席/工号/接听方式/状态/操作为必选）。

### M10-2 班长干预

| 按钮 | 函数 | 底层 |
|---|---|---|
| 监听 | `phone_listen` | `Originate` + `ChanSpy` data = `channel|q` |
| 结束监听 | `_cti_ui_endListen` | |
| 强拆 | `phone_hangupChannel` | `Hangup`，ActionID 前缀 `ForceHangup` |
| 抢接 | `phone_loot` | `Transfer` + `CallType:Loot`，要求自身 `busyType≠"0"` |
| 签出 | `phone_kick` | `Kick` |
| 签入手机 / SIP 话机 | `phone_pick` | `SignIn` |

> 无强插/耳语（`ChanSpy` 未用 `w`/`B`）。

### M10-3 座席状态日志

字段：`AgentName`、`ExtenType`、`BEGIN_TIME`、`END_TIME`、`LoginTimeLength`、`LoginType`、`BusyTimeLength`、`LogoutReason`、查看。

### M10-4 质检

页面：质检 / 质检结果查询 / 座席质检查询。
流程：配质检模板 → 提交录音到质检（`cdr.submitCallSheetRecordToQC`，权限 `func_submit_to_quality_check`）→ 按模板打分 → 查询。

---

## M11 · IVR 与流程编排

### M11-1 主界面 15 个 Tab

PBX信息(admin) / 服务号管理 / 日程管理 / 流程管理 / 座席管理(admin) / 外显号组管理(admin) / 技能组管理 / **节点管理(17类)** / 语音库 / 变量管理(admin) / SIP号管理(admin) / 黑红名单 / 电话条配置(admin) / 外呼线路配置(admin) / IVR工具(非admin移除)。

### M11-2 流程编辑（关键交互）

| 元素 | 规格 |
|---|---|
| 流程字段 | 流程名称 `DisplayName`、开始节点类型 `FirstNodeType`、开始节点 `FirstNode` |
| 加节点 | 右侧面板「新增节点」下拉，逐个添加；每个节点自己配转向目标 |
| 图形 | **mermaid.js 自动渲染（只读）**，无拖拽、无连线 |
| 按钮 | 放大 / 返回 / 保存 / **生效** / 删除 |
| 生效链路 | `config.ivr.reloadIvr` → HTTP POST 到 `pbx.configAddr`：`Action=PeerEffect` → `Action=Reload` → ACS 生成拨号计划并 reload Asterisk |

### M11-3 17 类节点字段明细

| 节点 | 关键字段 |
|---|---|
| 播放语音 | `DisplayName`、`Filename`（语音库下拉）、`NotBreak`（播放中不可打断）、`ToPeerType`/`ToPeer` |
| 播放文本(TTS) | `DisplayName`、`Engine`（kdxf禁用/aliTts默认/default/mrcp）、`AnnouncementText`（可插 `__VAR`）、`MrcpVar`、`WordInterval`、`SignInterval`、`IsMoney`、`ReplaceVar`、`VoiceName`、`Speed`、`Pitch`、`Volume`、转向 |
| 按键菜单 | `DisplayName`、`Timeout`（1-9999s，默认10）、`Filename`、各按键转向 |
| 采集输入 | 收号存变量 |
| 赋值 | 变量赋值 |
| MD5加密 | 对变量 MD5 |
| 按变量路由 | 条件表：**变量/条件/值/逻辑关系**（最多 20 条）；`ToPeerType/ToPeer`（满足）、`ToPeerTypeUnmatched/ToPeerUnmatched`（不满足） |
| CallUrl | `Url`、`MD5`、`Filename`、`Timeout`、`Data`（结果存变量）、`NextPeerType/NextPeer`（成功）、`ToPeerTypeWhenTimeout`（超时） |
| 时间 | 规则表：**日期(`月-日`或`*`)/时间(`时:分`，结束取 18:59 这类奇数)/星期/优先级(<999，越小越优先)/转向**；不满足转向 |
| 留言 | 录音留言 |
| 会议室 | 会议桥 |
| 自定义满意度 | 自定义评分节点与选项 |
| 自定义 | `Exten` + **`DialPlan`**（textarea，直接写 Asterisk dialplan） |
| 双向回呼 | |
| 语音识别 ASR | 识别结果存变量后路由 |
| 采集工号并拨打 | 客户输工号直拨 |
| 转IVR菜单 | 跳其他菜单 |
| 系统节点 | `0` 挂机 / `1` 满意度调查 / `2` 拨工号 |

### M11-4 转向目标枚举（20 种）

```
system, ivr_node_queue, account_user, ivr_node_announcement, text_announcement,
ivr, encrypt_md5, validation, assignment, route, ivr_menu, call_url, date,
twowaycall, asr, voice_mail, room, satisfaction, superDialJobNum, extension_peer
```

### M11-5 服务号

| 类型 | 字段 |
|---|---|
| 普通 `normal` | 服务号 `Exten`（**下拉选已购号码**）、别名 `DisplayName`；再建日程绑定流程 |
| 轻量 `lightweight` | 服务号、别名、**流程 `ivrProcessId`**、**流转到 `ToPeerType/ToPeer`**（免日程） |

号码来源：`bill.platform_num400` + `bill.platform_servicenum`，排除本账号已占用。
链路：**服务号 → 日程(`ServiceNo`) → 流程 → 节点 → 技能组/座席**。
> 未见 trunk/DID/技能组的直接绑定字段，均通过"流转到"间接实现。轻量号提示"号码加入黑名单后不生效"。

### M11-6 日程

字段：日程名称、优先级(1–999)、起始/结束日期、起始/结束时间、周一~周日复选、流程、流转到。
> **无独立节假日表**，节假日靠日期规则 + 优先级实现。

### M11-7 产物

保存生效后在账号目录下生成 **29 个 `.ael` 模板**（announcement / asr / assignment / blacklist / callroute / callurl / date_node / dialexten / dialjobnum / dialout / dynamicroute / encrypt_md5 / extension_peer / extensions / include / ivr / ivr_menu / ivr_validate / queue / room / satisfaction / serviceno / superDialJobNum / text_announcement / time_condition / twowaycall / validate / voicemail / webcall）。
前端节点管理只暴露 17 类，另有若干为系统内部节点。

---

## M12 · 组织与权限配置

### M12-1 坐席字段

| 字段 | name | 校验 |
|---|---|---|
| 座席姓名 | `displayName` | 必填 |
| 工号 | `exten` | **4 或 5 位数字**，唯一 |
| 工号类型 | `WorkersType` | 普通 / 附属 |
| 继承座席 | `inheritedFrom` | 附属工号时 |
| 密码 | `password` | 有推荐密码 |
| 是否管理员 | `type` | `agent` / `manager` |
| 手机 / 邮箱 | `mobile` / `email` | |
| **外显号码** | `callerIDNum` | |
| 后处理时长 | `AutoBusyTime` | 秒 |
| 角色 | `addRole` | 多选 |
| 版本 | `uversion` | |

另（`config/user/user_update.html`）：最小/最大同时接待会话数 `minImDealCount`/`maxImDealCount`、最大同时处理邮件数 `maxEmailDealCount`、修改座席详细资料开关 `updateIvrInfo`。

> 缺失项（重建时需自行补）：话机类型、外呼权限、录音权限、监听权限、电话最大并发（`isLimitCallOut` 仅存在于被注释代码）。

### M12-2 角色授权

**数据权限**：8 个模块（通话 call、客户 customer、工单 business、在线咨询 chat、邮件 email、质检 qc、问卷 question、短信 sms）× 4 级范围：
`level`=我和我的下属 / `all`=所有人 / `dept`=我的部门 / `deptLevel`=我和我的下属部门。

**功能权限**：zTree 勾选树，提交 `limits_in`（勾选节点 id 数组）。

### M12-3 电话条配置

管理员可改状态文案（空闲/忙碌/小休…），存 `manager_ivr_phonebar_config`，前端登录时随响应下发解析（`PhoneBarConfig` 字符串，形如 `k:v`）。

---

## M13 · 批量外呼

### 建任务三步向导

| 步 | 字段 |
|---|---|
| 第一步 | 号码导入方式 `numType`=`import`（可多次导入） |
| 第二步 | 控制方式 `taskType`=`normal`手动 / `time`定时；定时下：`timeType`（指定日期/每天）、`taskDate`、**时间段 `beginTime[]`/`endTime[]`（可多组）** |
| 第三步 | 任务名称 `name`、**服务号 `serviceNo`**、**技能组 `taskQueue`**（智能并发取空闲坐席数） |

| 配置 | 规格 |
|---|---|
| 导入 | Excel（xls/xlsx），号码第一列、无表头、支持多工作表；**过滤重复号码** `isPhone`；有模板下载 |
| 并发 | `limit` 数字必填 |
| 策略 | `AutoCallStrategy`=`static`固定 / `smart`智能；`SmartAutoCallCount` 倍数 |
| 列表 | 完成率 `calledRate`、接听率 `dialRate`、编辑、删除 |
| 详单 | 任务名/号码/状态（`4`=成功、`0`=失败） |

> 缺失败重呼次数/重呼策略配置。

---

## M14 · 对外对接能力

### M14-1 通话事件推送

| 字段 | name | 取值 |
|---|---|---|
| 描述 | `Name` | |
| PBX | `PBX` | 下拉（编辑时禁用） |
| 事件类型 | `ConcreteType` | `RingURL` 呼叫振铃 / `RingingURL` 被呼振铃 / `LinkURL` 接通 / `HanupURL` 通话结束 / `PeerURL` 座席状态 / `InvestigateURL` 满意度结束 |
| 地址 | `Url` | |

底层：HTTP `Action=EventInterfaceAdd`、`EventType=CallEvent`，存 `DB_INTERFACE_CONFIG_EVENT`。
> ⚠️ **推送报文格式源码未定义**，由 ACS 实现，对接前必须抓包确认。

### M14-2 接口配置 6 Tab

来电对接（描述/弹屏地址/**弹屏方式**）、首页对接（菜单排序、页面名称、页面地址）、客户TAB页对接、外呼对接（含状态）、**对接全局配置（开启 token 验证）**、通话事件。

token 说明：作用于来电对接 + 首页对接 + 客户TAB页对接；开启后 URL 追加 `token` 和 `tokenid`。
> 无 AK/SK、Basic Auth 等鉴权配置。

### M14-3 首页对接（iframe 嵌入）

- 页面本身是空壳，未配置时显示「未配置任何首页对接地址」
- 数据源 `getCache('urls')`
- 每个页面生成 Tab + `<iframe>`（frameborder=0，100% 宽高）
- **拼参**：`loginName=<坐席姓名>` + `loginExten=<工号>`（自动适配 `?` 或 `&`）；开 token 再加 `token`/`tokenId`
- 每 Tab 右上角「CRM 弹窗打开」`customer.CRMPopoverShow`；支持刷新 `urlInterface.iframeReload`

---

## M15 · 计费与运营后台

### M15-1 用户中心（租户自助）

顶部：企业名、**余额**、财务账户余额、透支额度、**立即充值**、主页、个人设置（改密码/预警设置/关于/退出）。

| 模块 | 菜单 |
|---|---|
| 主页 | 账户信息、充值记录、消费记录、账单查询、发票管理 |
| 云客服 | 资源续费、坐席 licence 设置、网关 SIP 号、话单查询、短信模板管理 |
| 云总机 | 资源续费、员工管理、网关 SIP 号管理、电话设置、话单查询、挂机短信 |
| 扣费设置 | 扣费设置 |

技术栈：jQuery 1.10.2 + Bootstrap 3 + 同一套 `DS` 框架，`DS.init({ds_url:"/action"})`。
> 「套餐订购」无独立页面，按产品按钮进各产品续费页。

### M15-2 平台运营后台（ExtJS 4.0.7）

顶部：欢迎、上次登录时间、**余额（5 秒轮询）**、今日外呼话费收入、今日 400 话费收入、立即充值、个人设置、退出。登录失败 ≥3 次出滑块验证；密码 base64 编码。

菜单 7 类：账户 / 资源 / 报表 / 系统 / 我的财务 / 话单 / 客户经理与顾问财务（详见 11 手册 4.2）。

### M15-3 跨系统跳转（4 类）

| 目标 | 实现 |
|---|---|
| 云客服管理后台 | `ccServerUrl` |
| 云客服 | `ccInUrl` → GET `service?action=getLoginSession` → sid → `?sessionId=` |
| 云电销 | `ccOutUrl`，同上 |
| 用户中心 | POST `./public` + `action=bill.getSessionId` → 返回脚本跳 `ucenterUrl/?sid=`（**不带尾斜杠**） |

跳转前：`bill.checkCCPbx`，>1 个 PBX 时弹窗选节点。

---

## 附 A · 页面清单总表（开发排期用）

| 域 | page key | 页面 |
|---|---|---|
| 登录 | — | `login_template.html`（40+ 皮肤变体） |
| 工作台 | `workbench/workbench_main` | 工作台 |
| 通话 | `call/incomingCall` | 来电弹屏 |
| | `cdr/cdr_main` | 通话（卡片式：来电/我的/所有） |
| | `cdr/my_call_sheet` | 我的通话记录 |
| | `cdr/call_sheet` | 所有通话记录 |
| | `cdr/my_call_sheet_leak` | 未接来电 |
| | `cdr/call_sheet_leak` | 所有未接来电 |
| | `cdr/call_sheet_export_monitor_task` | 批量导出录音任务 |
| | `cdr/monitor_main` / `cdr/monitor_agent` / `cdr/monitor_report` / `cdr/cdr_peer_list` | 监控 4 页 |
| 客户 | `customer/customer_main` / `customer_list` / `customer_list_page` / `customer_import` / `customer/task/task` | CRM 5 页 |
| 工单 | `business/task_main` / `business/task_list` | 工单 2 页 |
| 短信 | `sms/sms_main` + 5 子页 | 短信 6 页 |
| 问卷 | `questionnaire/ques_main` / `ques_list` / `ques_import` | 问卷 3 页 |
| 知识库 | `km/km_main` | 知识库 |
| 在线/邮件 | `webchat/webchat_main` / `email/email_main` | 2 页 |
| 质检 | `qualityCheck/*` | 3 页 |
| 报表 | `report/*`（8 张报表） | 8 页 |
| 配置 | `config/config_main`（10 Tab）、`config/callConfig/call_config` + `ivrMain`（15 Tab + 17 类节点各 2~3 页） | 60+ 页 |
| 批量外呼 | `batch2/task_main` | |
| 对接 | `urlInterface/url_interface`、`config/interfaceUrl/config_interface` | |
| 计费 | 用户中心 + 运营后台（ExtJS，7 大类菜单） | 50+ 页 |

**合计约 150+ 个独立页面**（不含皮肤变体）。

## 附 B · 重建时的"已知缺失"清单

以下能力**原系统没有**，若客户需要须自行设计开发：

| 缺失 | 影响 |
|---|---|
| WebRTC 网页通话 | 坐席必须自备话机或软终端 |
| 强插 / 耳语 | 班长只能静默监听 |
| 坐席外呼/录音/监听权限开关 | 权限粒度不够 |
| 电话并发上限配置 | 只有 IM/邮件并发 |
| 工单与问卷的填空/评分题型 | 题型单一 |
| 失败重呼策略 | 批量外呼能力偏弱 |
| 独立节假日表 | 只能靠时间节点拼 |
| 接口鉴权（AK/SK） | 只有全局 token |
| 通话事件推送报文规范 | 需抓包反推 |
| 公海入口（被注释） | 需自行启用 |
| 工作台在线坐席/排队数卡片 | 需自行补 |
