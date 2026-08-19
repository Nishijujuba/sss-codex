# Codex 长程任务本地源码审计：持久化、压缩、目标、子 Agent 与恢复机制

> 文档类型：本地源码证据稿  
> 审计日期：2026-07-11  
> 审计基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`  
> 仓库：`D:\Project\codexx-wiki\sss-codex`  
> 证据标签：`[事实]` 表示源码或测试直接支持；`[推断]` 表示由多处源码共同支持的因果解释；`[边界]` 表示源码明确缺失、无法证明或存在失败窗口。

## 一、核心结论

Codex 的长程任务能力由一组彼此解耦、相互补位的状态机制构成。当前源码能够证明的核心设计共有六层：

1. **工作结果层**：文件、Git、外部系统状态承担任务事实的最终落盘。目标提示词明确要求把当前工作树和外部状态视为权威证据。
2. **会话事件层**：rollout JSONL 追加记录模型消息、工具调用与输出、回合边界、压缩检查点、上下文基线和目标更新事件。
3. **模型上下文层**：上下文达到阈值后生成 `CompactedItem.replacement_history`，恢复时从最新存活检查点加后续增量重建模型可见历史。
4. **目标状态层**：`/goal` 使用独立 SQLite 表持久化目标、状态、token 预算、已用 token 和时间；达到目标预算时通过原子 SQL 更新为 `budget_limited`。
5. **线程与 Agent 图层**：线程索引、父子 spawn edge、agent path 和会话元数据落入 SQLite/rollout；运行时用共享注册表约束并发和容量。
6. **短期运行层**：计划 UI、邮箱队列、后台进程表、共享 rollout 预算计数器主要位于内存，部分信息会通过事件或工具记录进入 rollout，运行时对象本身没有完整重建协议。

因此，“触发 token 限额时任务状态落盘”需要按限额种类拆开理解：

| 限额或状态 | 触发位置 | 权威状态 | 持久化结果 | 恢复行为 |
|---|---|---|---|---|
| 上下文窗口阈值 | `session/context_window.rs`、`session/turn.rs` | `CompactedItem.replacement_history` | rollout JSONL 中的压缩检查点、窗口链、WorldState、TurnContext | 从最新有效检查点和后缀重建模型历史 |
| `/goal` 的 `token_budget` | goal extension 的 tool-finish / turn-stop / abort / error 结算屏障 | goals SQLite 的 `thread_goals` 行 | 原子累加 `tokens_used` 并切换 `budget_limited`；另发 `ThreadGoalUpdated` 进入 rollout | resume 时从 goals SQLite 恢复；`budget_limited` 不自动继续 |
| 会话树 `RolloutBudget` | 每次服务端 token usage 返回 | 内存共享计数器 | reminder 作为 conversation item 进入 rollout；终止事件进入 rollout | 当前源码未显示累计计数器从 rollout/SQLite 恢复 |
| 账户/服务 usage limit | 服务端 `UsageLimitReached` / `UsageLimitExceeded` | rate-limit 快照与 goal 状态 | 活跃 goal 会被标记为 `usage_limited`；token/rate 信息按相应事件保存 | goal 从 SQLite 恢复，服务端限额仍取决于后续响应 |
| `update_plan` checklist | 模型工具调用 | UI 事件 | `PlanUpdate` 明确属于 transient；工具 call/output 仍可留在对话记录 | 没有独立 plan 表或 canonical checklist 恢复器 |

`[事实]` 上表说明了一个容易混淆的点：上下文 token 限额产生“模型上下文检查点”，`/goal` token 预算产生“目标数据库状态”，会话树预算产生“采样终止和提示”。三者具有不同的数据结构、生命周期和恢复能力。

`[推断]` 这套分层让较强模型能够把能力增益放大：模型负责高质量拆解、摘要、工具选择和完成审计；harness 负责把每次有效行动变成可恢复证据，避免让模型单独承担全部长期记忆。

`[边界]` 当前本地源码无法证明任何 GPT-5.6 Sol Ultra 专属训练配方、强化学习任务分布、隐藏系统提示词或服务端模型实现。源码也未显示按 `5.6-sol` 名称分叉的长程状态机。模型专项训练相关结论需要官方材料或团队披露支持。

## 二、状态架构：追加日志、数据库投影与外部事实

源码呈现出“不可变事件流 + 可查询投影 + 外部事实”的组合：

```text
模型采样 / 工具执行 / 子 Agent
          |
          +--> 工作树、Git、外部系统         任务实际结果
          |
          +--> rollout JSONL                 追加式会话事实、回合边界、压缩检查点
          |
          +--> threads / spawn edges SQLite  线程索引与 Agent 图投影
          |
          +--> goals SQLite                  目标、预算、累计用量、终止状态
          |
          +--> 内存运行态                    mailbox、进程表、PlanUpdate、RolloutBudget
```

`[事实]` `RolloutItem` 的公开枚举包含 `SessionMeta`、`ResponseItem`、inter-agent communication、`Compacted`、`TurnContext`、`WorldState` 和 `EventMsg`，见 `codex-rs/protocol/src/protocol.rs:3139-3154`。`SessionMeta` 同时保存 fork/parent lineage、agent nickname/role/path、history mode、multi-agent version 和初始 context-window ID，见同文件 `3017-3071`。

`[事实]` `WorldStateItem` 保存用于恢复模型可见世界状态 diff 的 full snapshot 或 merge patch，见 `protocol.rs:3156-3172`。WorldState section 的快照契约只保存“决定下一次需要告诉模型什么”的比较数据，section ID 必须稳定，见 `core/src/context/world_state/mod.rs:170-204`。当前基础 section 包括 AGENTS.md、环境、Apps 可用性、Plugins 可用性以及 extension 提供的 section，见 `core/src/session/world_state.rs:11-80`。

`[边界]` WorldState 不是任意应用内存转储。它服务于模型可见上下文 diff，无法替代文件系统、goal DB、Agent mailbox 或后台进程状态。

## 三、rollout JSONL：长程恢复的事件主干

### 3.1 延迟物化、顺序追加与写入屏障

`[事实]` 新线程创建 `RolloutRecorder` 时先计算路径和 metadata，直到显式 `persist()` 才创建文件；恢复线程立即以 append 模式打开已有 rollout，见 `codex-rs/rollout/src/recorder.rs:750-843`。writer 使用容量为 256 的有界 mpsc 通道和独立 Tokio task，见 `recorder.rs:847-870`。

`[事实]` `record_canonical_items` 负责排队；`persist` 与 `flush` 使用 oneshot ack 形成调用方可等待的屏障，见 `recorder.rs:884-938`。writer state 只在单条 item 成功写入后从 `pending_items` 删除；第一次 I/O 失败会丢弃 file handle、重新打开并重试，未写后缀保留在内存，见 `recorder.rs:1555-1723`。

`[事实]` JSONL 每行包含 timestamp、可选 ordinal 和一个 `RolloutItem`；写入调用 `write_all` 后执行 `file.flush()`，见 `recorder.rs:1836-1875`。恢复 append 会补齐缺失换行并继续 ordinal，见 `recorder.rs:1802-1833`。

`[事实]` LocalThreadStore 在 live append 时先按持久化策略过滤，再 queue items，随后等待 recorder `flush()`；注释明确指出该顺序用于防止 SQLite metadata 超前于 JSONL，见 `codex-rs/thread-store/src/local/live_writer.rs:109-140`。这使本地 live append 在 API 边界具备同步屏障语义，即使 recorder 内部使用异步 writer。

### 3.2 哪些事件会保存

`[事实]` `should_persist_event_msg` 将 `TokenCount`、`ThreadGoalUpdated`、rollback、TurnStarted、TurnComplete、TurnAborted、ThreadSettingsApplied 视为 durable，见 `codex-rs/rollout/src/policy.rs:84-115`。`PlanUpdate`、`TurnDiff`、warning、error、实时输出 delta 和多数协作 begin/end 事件属于 transient，见 `policy.rs:117-174`。

`[事实]` 模型 API 的 `ResponseItem` 具有独立持久化策略。因此，即使 UI 事件 transient，对应 function call 和 function call output 仍可能作为对话历史存在。该区别解释了“恢复后模型可能看得到曾经更新计划的调用文本，客户端却没有权威 checklist 状态”。

### 3.3 回合终点和中断点的额外屏障

`[事实]` session task 在通知 turn 完成前调用 `flush_rollout`；失败时发出“conversation transcript 保存失败并将继续重试”的 warning，见 `codex-rs/core/src/tasks/mod.rs:401-430`。terminal TurnComplete/TurnAborted 追加后再次 flush，见 `tasks/mod.rs:804-808` 与 `914-918`。

`[事实]` 用户中断时，Codex 先把 interrupted-turn marker 写入历史并 flush，随后发 `TurnAborted`。注释给出的原因是客户端可能在收到 abort 时同步重读 rollout，见 `tasks/mod.rs:865-883`。fork 一个仍处于 mid-turn 的快照也会补同类 marker 和 `TurnAborted`，见 `core/src/thread_manager.rs:1850-1924`。

`[推断]` 这些屏障把长任务的故障损失窗口压缩到“最近一次尚未成功 append/flush 的 item”，并让客户端看到 terminal 状态时，前序工作证据通常已经可读。

### 3.4 失败边界

`[边界]` 当前 writer 使用 `flush()`，源码未调用 `sync_all()`。该证据支持进程级写缓冲提交，无法证明断电后的物理介质 durability。

`[边界]` `Session::persist_rollout_items` 在 append 失败时记录 error 日志，没有把错误返回调用者，见 `core/src/session/mod.rs:3492-3499`。task 终点的显式 flush 会再暴露错误并发 warning；若进程在此之前崩溃，pending 内存后缀可能丢失。

`[事实]` 对应测试覆盖 flush 触发首次物化、文件系统错误后保留 pending、writer 第一次写失败后重试、ordinal gap 延续、unsafe tail 修复与 ordinal overflow 拒绝追加，见 `rollout/src/recorder_tests.rs:488-556`、`648-736`、`738-831`。

## 四、压缩检查点：模型上下文的连续性

### 4.1 触发条件

`[事实]` `context_window_token_status` 同时计算完整 active context token、配置的 auto-compact scope、模型窗口上限和剩余 token。scope 可取 Total 或 BodyAfterPrefix；任一阈值达到时 `token_limit_reached=true`，见 `core/src/session/context_window.rs:5-91`。

`[事实]` 回合开始前会运行 pre-sampling compaction；源码 TODO 承认当前还未把即将注入的 context diff 和新 user input 预估进触发判断，见 `core/src/session/turn.rs:143-166`。每次 sampling 完成后再次收集 pending input 和 token status；需要 follow-up 且收到 `new_context` 请求或达到阈值时执行 mid-turn auto compact，见 `session/turn.rs:300-370`。

### 4.2 本地摘要式 compaction

`[事实]` 本地 compact task 克隆历史、附加 compact prompt、调用模型生成摘要。若服务端返回 ContextWindowExceeded 且仍有多条输入，它从最旧项开始删除，保留近期消息和 cache 友好的前缀行为，见 `core/src/compact.rs:220-320`。

`[事实]` compact prompt 明确要求生成给“另一个 LLM”继续任务的 checkpoint handoff，内容包含当前进展和决策、约束与偏好、剩余步骤、关键数据和引用，见 `codex-rs/prompts/templates/compact/prompt.md:1-9`。

`[事实]` compact 完成后构建新 history，推进 window chain，并创建带完整 `replacement_history`、window number、first/previous/current window ID 的 `CompactedItem`，见 `compact.rs:322-368`。`replace_compacted_history` 依次持久化 Compacted、full WorldState baseline、TurnContext baseline，见 `core/src/session/mod.rs:3020-3059`。

`[事实]` 源码在每次本地 compaction 后直接警告：长线程和多次压缩可能降低模型准确率，见 `compact.rs:370-375`。该 warning 是对信息损失风险的明确承认。

### 4.3 无摘要的新窗口与远端压缩

`[事实]` `new_context` 工具请求一个 fresh context window，工具描述明确说明不会总结现有对话；`start_new_context_window` 仍创建空 message 的 `CompactedItem`，并保存 replacement history、WorldState、TurnContext 和 window chain，见 `core/src/tools/handlers/new_context_window.rs:13-40`、`core/src/session/mod.rs:3528-3558`。

`[事实]` `run_auto_compact` 还可路由 Remote、RemoteV2 和 TokenBudget 分支。RemoteV2 会把 compaction 本身 token usage 纳入 rollout budget，并对 retained messages 执行预算截断；这些行为位于 `core/src/compact_remote_v2.rs:274-318`、`430-535`。服务端摘要算法的内部实现不在本地仓库中。

### 4.4 恢复算法

`[事实]` `reconstruct_history_from_rollout` 先从最新向最旧扫描，处理 rollback、未完成回合、TurnContext、WorldState 和 window metadata；一旦找到存活的 `replacement_history` 以及所需 resume metadata，较老条目不再影响结果，见 `core/src/session/rollout_reconstruction.rs:112-307`。

`[事实]` 随后从该 checkpoint 之后的 rollout suffix 正向重放。遇到带 replacement history 的 Compacted 会精确 replace；兼容旧 rollout 的 `replacement_history=None` 时，会从 user messages 与 compacted.message 重建，并明确接受临时的 out-of-distribution prompt shape，见 `rollout_reconstruction.rs:317-373`。

`[事实]` 原始较早的 `ResponseItem` 仍保留在追加式 JSONL 中。`replacement_history` 决定恢复后的模型可见历史，不会重写或删除旧日志。这一点可以通过 `RolloutItem::Compacted` 与反向扫描逻辑共同确认。

`[推断]` Sol Ultra 若在长程任务中表现更稳，最可能直接受益于两项模型能力：生成高保真 handoff summary，以及在仅持有 replacement history 后准确恢复约束、计划和证据位置。harness 提供检查点协议，摘要质量仍由模型与服务端 compact 能力决定。

`[边界]` 被摘要遗漏的细节无法从 active context 自动恢复。Agent 仍可通过读取 rollout、文件、Git 或其他外部 artifact 找回证据；当前 normal turn 没有自动全文检索旧 JSONL 的通用恢复步骤。

`[事实]` 重建测试覆盖 typed inter-agent message、WorldState baseline、completed/incomplete turn rollback、legacy compaction、window chain、trailing incomplete compaction 和 replacement checkpoint，见 `core/src/session/rollout_reconstruction_tests.rs:111-1830`。

## 五、`/goal`：真正的跨回合任务状态机

### 5.1 持久化数据模型

`[事实]` `thread_goals` 表以 `thread_id` 为主键，保存 `goal_id`、objective、status、token_budget、tokens_used、time_used 和时间戳。状态集合为 active、paused、blocked、usage_limited、budget_limited、complete，见 `codex-rs/state/goals_migrations/0001_thread_goals.sql:1-18`。

`[事实]` protocol 对 objective 设置 4,000 字符上限，见 `codex-rs/protocol/src/protocol.rs:3980-4031`。state 模型把 `BudgetLimited` 和 `Complete` 判为 terminal，见 `state/src/model/thread_goal.rs:12-42`。

### 5.2 token 如何结算并触发落盘

`[事实]` 服务端 token usage 到达 `Session::record_token_usage_info` 后，先更新 session token info 和 rollout budget，再通知 extension 的 `TokenUsageContributor`，见 `core/src/session/mod.rs:3678-3711`。Goal extension 把累计 usage 记入每回合 accounting state，见 `ext/goal/src/extension.rs:326-353`。

`[事实]` goal token delta 的计算为：

\[
\Delta_{goal}=\max(0,\Delta input-\Delta cached\_input)+\max(0,\Delta output)
\]

该公式来自 `ext/goal/src/accounting.rs:313-333`。reasoning output 没有额外重复相加；cached input 被扣除。

`[事实]` 每次符合条件的工具结束后，Goal extension 调用 `account_active_goal_progress`。turn stop、abort、terminal error 也会执行最终结算，见 `ext/goal/src/extension.rs:243-323`、`355-403`。

`[事实]` `account_thread_goal_usage` 用单条 `UPDATE ... SET tokens_used=tokens_used+delta, status=CASE ... RETURNING` 原子地累加，并在 active 状态且 `tokens_used + delta >= token_budget` 时切换为 `budget_limited`，见 `state/src/runtime/goals.rs:411-523`。`expected_goal_id` 条件防止旧回合把用量写入已经替换的新 goal。

`[事实]` accounting 使用 semaphore 串行化并发工具完成结算，GoalRuntime 另有 goal-state semaphore，防止外部目标变更、状态更新和 idle continuation 交错，见 `ext/goal/src/accounting.rs:304-310`、`ext/goal/src/runtime.rs:80-132`、`431-491`。

`[事实]` 目标更新后发出 `ThreadGoalUpdated`；该事件被 rollout policy 明确持久化，见 `ext/goal/src/runtime.rs:482-488` 与 `rollout/src/policy.rs:94-100`。目标数据库是权威状态，rollout event 提供可观察审计轨迹。

### 5.3 达到预算后的行为

`[事实]` 首次观察到 `BudgetLimited` 的 tool-finish 会向当前 active turn 注入一次 budget-limit steering。提示词要求停止新增实质工作，尽快总结有用进展、剩余工作、阻塞和清晰下一步，见 `ext/goal/src/extension.rs:390-402` 与 `prompts/templates/goals/budget_limit.md:1-16`。

`[事实]` goal 达到预算后仍会在同一回合末尾完成剩余用量结算；测试覆盖 budget-limited 后继续到 turn stop、后续 tool finish 的累计，见 `ext/goal/tests/goal_extension_backend.rs:361-494`。

`[事实]` resume 时只把状态为 Active 的 goal 重新装入 idle accounting；其他状态清空 active accounting，见 `ext/goal/src/runtime.rs:335-356`。因此 `budget_limited` 不会在重启后自动继续消耗。

### 5.4 自动续跑与完成审计

`[事实]` thread idle hook 调用 `continue_if_idle`。它在 tools 可见、thread live、goal 仍为 Active 时，通过 `try_start_turn_if_idle` 注入 continuation item，见 `ext/goal/src/extension.rs:154-166`、`ext/goal/src/runtime.rs:359-415`。

`[事实]` continuation prompt 把目标定义为跨 turn 持续，要求保持完整 objective、以工作树和外部状态为权威、让 `update_plan` 与真实目标同步，并在 complete 前逐项寻找证据。blocked 只有同一阻塞连续出现至少三个 goal turns 且无法继续时才允许设置，见 `prompts/templates/goals/continuation.md:1-51`。

`[推断]` 这里的设计巧思在于把“继续做”和“何时宣告完成”拆成两层：数据库决定 goal 是否仍 active；模型提示词执行 requirement-by-requirement completion audit。较强模型更能遵守不缩小目标、不把局部通过当整体完成的规则。

### 5.5 `/goal` 能保存与不能保存的内容

`[事实]` goals SQLite 保存 objective、枚举状态、预算、已用 token、已用时间和时间戳。

`[边界]` goal row 没有保存任意模型思维、`update_plan` checklist、子 Agent mailbox、后台命令、尚未写入文件的草稿或每项 requirement 的细粒度状态。预算触发时的“进展总结”依靠 steering 后模型生成；任务实际进展依靠工作树、外部系统与 rollout 工具记录。

`[边界]` Plan collaboration mode 的 turn 不参与 goal 激活和 usage-limit stop，见 `ext/goal/src/extension.rs:210-240`。该选择避免纯规划回合错误终止 active goal，也意味着 Plan mode 不是 goal 执行结算面。

## 六、会话树 RolloutBudget：另一套预算

`[事实]` `RolloutBudget` 是一个 root-thread session tree 共享的内存对象，使用 `OnceLock<Mutex<...>>` 保存配置、weighted_tokens_used 和每线程 reminder delivery，见 `core/src/rollout_budget.rs:14-40`。

`[事实]` 加权用量为 output token 乘 sampling weight，加 non-cached input 乘 prefill weight；达到 limit 后 `record_usage` 持续返回 true，见 `rollout_budget.rs:43-52`。达到阈值会返回 `SessionBudgetExceeded`，见 `core/src/session/rollout_budget.rs:25-36`。

`[事实]` reminder 会先作为 model-visible conversation item 记录，记录成功后才标记 delivered，见 `session/rollout_budget.rs:8-23` 和 `rollout_budget.rs:80-97`。

`[边界]` 当前代码没有显示 `weighted_tokens_used` 或 deliveries 从 JSONL/SQLite 恢复。提醒文本会进入 rollout，TurnAborted/TurnComplete 会进入 rollout，共享预算计数器本身属于 runtime state。应用重启后的精确会话树预算连续性无法由该实现证明。

`[边界]` RolloutBudget 触发 `SessionBudgetExceeded` 后，Goal extension 将其视为普通 terminal turn error；活跃 goal 可能被转为 `blocked`，除非 goal 已在自身预算结算中变成 `budget_limited`。两种预算同时配置时，状态归因需要结合事件顺序分析。

## 七、`update_plan`：高价值可见性，弱持久性

`[事实]` `update_plan` 解析 `UpdatePlanArgs` 后只发 `EventMsg::PlanUpdate`，返回固定的 `Plan updated` function output，见 `core/src/tools/handlers/plan.rs:62-99`。schema 只允许 pending、in_progress、completed，并在描述中要求最多一个 in_progress，见 `core/src/tools/handlers/plan_spec.rs:7-57`。

`[事实]` `PlanUpdate` 在 rollout policy 中明确为 transient，见 `rollout/src/policy.rs:154-160`。没有 `plans` SQLite 表、plan revision 或 resume reducer。

`[推断]` plan 的长期价值主要来自三个渠道：用户实时看见执行结构；模型对话中保留工具参数；goal continuation prompt 要求后续回合重建和更新计划。该机制属于认知支架和 UI 协议，持久任务真相仍需要文件、issue、PRD、测试、goal row 等 artifact。

`[边界]` 若客户端重启并仅依赖 durable event replay，最新 checklist 不能由 `PlanUpdate` 事件恢复。需要强任务状态的工作流应把 plan 落成仓库 artifact 或扩展一个 canonical plan store。

## 八、多 Agent：受控并发、上下文裁剪与结果路由

### 8.1 容量和原子 reservation

`[事实]` 同一 root session tree 共享一个 `AgentControl` 和 `AgentRegistry`。registry 记录 agent tree、nickname、path 与总数，并通过 atomic compare-exchange 执行 max-threads 限制，见 `core/src/agent/control.rs:88-108`、`agent/registry.rs:16-42`、`79-97`。

`[事实]` spawn 先申请 slot、nickname 和 agent path；成功时 commit，任何失败路径依靠 `SpawnReservation::drop` 回收 path 和计数，见 `agent/registry.rs:308-353`。测试覆盖 max-thread 限制在 clone 间共享、shutdown 释放 slot、resume 失败释放 slot，见 `agent/control_tests.rs:1709-1934`。

`[推断]` reservation 模式防止并发 spawn 把容量计数、路径唯一性和真实子线程数量分裂，属于长程 coordinator 稳定性的基础不变量。

### 8.2 fork 前的持久化和上下文卫生

`[事实]` 子 Agent 从父线程 fork 前先强制 materialize 和 flush 父 rollout，再从 ThreadStore 读 snapshot，见 `core/src/agent/control/spawn.rs:460-481` 与 `core/src/thread_manager.rs:723-755`。这避免子 Agent 读取到缺失父线程最新行动的旧快照。

`[事实]` fork filter 保留 system/developer/user 消息和 final-answer assistant 消息；tool calls、reasoning、inter-agent communication 等被过滤。FullHistory 可保留 TurnContext/WorldState baseline，LastNTurns 会丢弃这类 reference baseline 并在子线程重建，见 `agent/control/spawn.rs:45-78`。

`[事实]` V2 还会从普通 rollout 与 `replacement_history` 中移除父 Agent 的旧 multi-agent usage hint，再注入适用于子 Agent 的 hint，见 `agent/control/spawn.rs:493-562`。

`[推断]` 该过滤策略降低子 Agent 对父 Agent 工具噪声和角色提示的错误模仿，同时保留任务指令和最终决策。FullHistory/LastNTurns 显式区分上下文完整度，减少隐式截断带来的不一致。

### 8.3 Agent 图和命名

`[事实]` V2 用 canonical `AgentPath` 表示层级任务名。spawn tool 描述说明相对路径和完整路径解析方式，并限制只给可并行的具体、有界子任务，见 `core/src/tools/handlers/multi_agents_spec.rs:711-730`。

`[事实]` 非 ephemeral 子线程会将 parent/child/status edge upsert 到 agent graph store，见 `agent/control.rs:682-710`；SQLite schema 位于 `state/migrations/0021_thread_spawn_edges.sql:1-8`。SessionMeta 同时保存 parent_thread_id 和 agent_path。

`[事实]` unloaded V2 agent 可根据 ThreadStore 中的持久化数据重新 load。相关测试覆盖存储 metadata 恢复、open descendants 重建、stale descendant metadata 时优先 edge data，见 `agent/control_tests.rs:2393-2553`、`2966-3379`。

### 8.4 mailbox、wait 与 completion

`[事实]` V2 区分 `send_message` 的 queue-only 和 `followup_task` 的 trigger-turn 语义。mailbox 是 `Mutex<VecDeque<InterAgentCommunication>>`，activity watch 区分 Mailbox 与 Steer，见 `core/src/session/input_queue.rs:22-101`。

`[事实]` `wait_agent` 订阅 mailbox/steer activity，使用配置的 min/default/max timeout；返回结果只表示 mailbox、steer 或 timeout，不携带完成内容，见 `tools/handlers/multi_agents_v2/wait.rs:36-195`。完成内容在后续 pending-input drain 中进入模型上下文。

`[事实]` mailbox item 被 drain 后，`record_pending_input` 调用 `record_inter_agent_communication`；该函数把 response item 和 `trigger_turn` metadata 写入 rollout，见 `core/src/hook_runtime.rs:539-563`、`core/src/session/mod.rs:2919-2947`。

`[边界]` mailbox queue 在通信被 drain 和 record 之前属于内存状态。应用崩溃可能丢失尚未消费的消息。Agent graph edge 的持久化不能替代 mailbox durability。

`[事实]` child terminal event 会由 watcher 或 V2 direct-parent 路径转成标准 inter-agent completion message，投递给直接父 Agent，见 `agent/control.rs:454-540` 与 `session/mod.rs:1813-1919`。Interrupted 状态不被视为 final，见 `agent/status.rs:4-27`。

`[边界]` `session_prefix.rs:10-43` 只对 errored completion 做约 1,000-token 截断；`Completed(Some(message))` 直接复制成功消息。当前路径没有显示成功 completion payload 的等价 hard cap。这与长程上下文“所有注入片段应有硬上限”的目标存在风险，需要单独审查。

### 8.5 提示词中的调度策略

`[事实]` V1 spawn tool 的默认长描述要求先找 critical path 与 sidecar work、只并行 concrete bounded task、避免重复工作、coding 子任务使用不相交 write set、少用 wait、等待期间继续本地非重叠工作，见 `multi_agents_spec.rs:674-707`。V2 描述更短，并允许通过配置传入 usage hint text；MultiAgentMode 的 Proactive developer fragment 仅在“并行能显著提升速度或质量”时授权主动 delegation，见 `core/src/context/multi_agent_mode_instructions.rs:6-40`。

`[推断]` 子 Agent 规划质量来自模型与 harness 的联合约束：模型识别依赖图和 write set；工具层强制路径、容量、fork 语义和消息路由；文件系统承担共享结果。Sol Ultra 更强的任务分解会直接减少重复探索、阻塞等待和写冲突。

## 九、长时间命令：yield、poll 和有界输出

`[事实]` Unified Exec manager 在内存 `ProcessStore` 中维护 process ID、PTY handle、call ID、cwd、last_used 等，最多 64 个 process；默认输出回复上限 10,000 token，底层 retained output 上限 1 MiB，见 `core/src/unified_exec/mod.rs:64-73`、`121-166`。

`[事实]` `exec_command` 在初始 yield 等待前把仍存活的 process 放入 store。注释明确指出这样可以避免 turn interrupt 使最后一个 Arc 被释放并终止后台进程，见 `unified_exec/process_manager.rs:451-477`。若 yield 截止时仍存活，tool output 返回 process/session ID；后续 `write_stdin` 可发送输入或用空 input poll，见 `process_manager.rs:479-508`、`557-650`、`656-813`。

`[事实]` 初始 yield 被 clamp 到 250–30,000ms；Windows 初始执行至少 2,000ms。空 poll 至少 5,000ms，并受可配置 background timeout 上限约束，见 `unified_exec/mod.rs:64-74`、`168-179` 和 `process_manager.rs:710-719`。

`[事实]` 输出使用 head-tail buffer，超过上限时保留稳定前缀和后缀并插入 omission marker；单次流式 delta 另有 8KiB 限制，见 `unified_exec/head_tail_buffer.rs:5-152`、`unified_exec/async_watcher.rs:31-35`。process 数达到 64 时，prune 优先删除非近期的 exited process，再按 LRU 删除未受保护项，见 `process_manager.rs:1353-1398`。

`[事实]` 测试覆盖跨多次 request 的交互进程、并行 session、timeout 后再 poll 取回输出、超大 timeout clamp、completed command 不残留 session 和 poll 期间 terminate，见 `unified_exec/mod_tests.rs:356-837`。

`[推断]` yield/poll 把“一个模型工具调用必须阻塞到命令结束”改成可暂停状态机，模型可以在长构建或测试运行时继续做其他工作，随后根据 process ID 回收结果。

`[边界]` ProcessStore 是内存对象；thread resume 没有从 rollout 恢复本地 PTY handle 的协议。后台命令跨 turn 存活，不能据此推出跨应用重启存活。process 被 LRU prune 时也可能终止或失去管理入口，具体取决于 removal 后 Arc 生命周期。

## 十、线程索引、恢复与数据库损坏处理

`[事实]` threads SQLite 保存 rollout_path、created/updated time、source、provider、cwd、title、sandbox/approval、tokens、archive 和 Git metadata，见 `state/migrations/0001_threads.sql:1-25`。它主要提供索引和查询投影；ThreadStore 加载完整 history 时仍调用 `RolloutRecorder::load_rollout_items` 读取 JSONL，见 `thread-store/src/local/read_thread.rs:294-302`。

`[事实]` resume 会从 rollout 构造 `InitialHistory` 并重新 spawn session；同一 thread 已运行时返回现有实例，rollout path 不一致会拒绝，见 `core/src/thread_manager.rs:760-817`、`1518-1562`。fork 创建新 thread ID，并记录 source lineage，见 `thread_manager.rs:949-1069`。

`[事实]` forked session 启动时先应用 rollout reconstruction，再把复制的 rollout items 持久化到新 thread，强制 materialize 并 flush，见 `core/src/session/mod.rs:1381-1411`。resume/fork 也会从最近持久化的 TokenCount seed UI token info，见 `session/mod.rs:1368-1398`。

`[事实]` SQLite corruption recovery 能识别 `SQLITE_CORRUPT`/`SQLITE_NOTADB` 代码与常见错误文本，只移动失败数据库及 WAL/SHM 到唯一 `db-backups` 目录，让其他 runtime DB 保留，见 `state/src/runtime/recovery.rs:1-6`、`94-137`、`144-211`。

`[边界]` 如果独立 goals DB 损坏并 fresh-start，当前源码未显示从 rollout 的 `ThreadGoalUpdated` 事件反向重建 `thread_goals` 表。rollout 可能保留审计事件，active goal 的权威 DB 行仍会丢失。

`[边界]` SQLite index 与 JSONL 路径可能漂移。read/list 测试包含 stale rollout path 和 path 指向其他 thread 时的 fallback search，见 `thread-store/src/local/read_thread.rs:1026-1121`；该兼容逻辑降低索引漂移风险，无法修复被破坏的 JSONL 内容本身。

## 十一、模型历史规范化：处理中断和不完整工具对

`[事实]` `ContextManager` 维护 oldest-to-newest ResponseItems、history version、token info、TurnContext reference baseline 和 WorldState baseline；replace 会提升 history version 并清空 world-state baseline，见 `core/src/context_manager/history.rs:36-69`、`200-204`。

`[事实]` 发送模型前，normalizer 保证每个 function/custom call 都有 output、删除 orphan output，并在模型不支持图像时移除图像，见 `history.rs:355-368`。

`[事实]` 中断后若工具 call 没有 output，normalizer 插入内容为 `aborted` 的 synthetic output。synthetic ID 由源 call item ID 和固定 UUIDv5 namespace 派生，保证 retry/resume 时稳定并尽量保留 prompt cache，见 `context_manager/normalize.rs:18-143`。

`[推断]` 该设计把异常中断的半开工具协议修复成 API 可接受历史，使后续模型无需面对“存在 function call 但缺少 output”的非法序列。长任务中的取消、网络失败和 fork 因而更容易继续。

`[事实]` token 估算使用 byte-based heuristic，源码明确标注为 coarse lower bound，见 `history.rs:160-185`。实际阈值优先依赖服务端 usage；重算和预估仍可能低估包含复杂字符、结构化数据或图片的真实 token。

## 十二、TurnDiff：可观察性层，不是 checkpoint

`[事实]` 每个用户可见 turn 创建一个 `TurnDiffTracker`。它只跟踪已 commit 的 apply_patch delta，不重新读取工作树；非 exact delta 会使 tracker invalid，见 `core/src/turn_diff_tracker.rs:48-116`。

`[事实]` tracker 用 baseline/current content、rename origin 和 revision cache 生成本 turn 净 unified diff，并给 diff 计算设置 100ms timeout，见 `turn_diff_tracker.rs:13-18`、`123-183`。sampling completed 后才决定发送 TurnDiff，且会等待 pending tools drain，见 `core/src/session/turn.rs:2278-2297`、`2470-2493`。

`[事实]` `TurnDiff` 在 rollout policy 中属于 transient，见 `rollout/src/policy.rs:154`。因此它是 UI 观测和 review 辅助；真正 durable 的变更是文件系统内容、Git 和 tool call/output rollout。

`[边界]` tracker 只覆盖能提供 exact `AppliedPatchDelta` 的变更。shell、MCP 或外部程序直接改文件时可能 invalid 或缺失；它没有工作树全量 checkpoint 语义。

## 十三、模型能力与 harness 的因果连接

以下连接属于源码支持的工程推断，无法替代模型训练披露：

### 13.1 高质量压缩摘要放大长上下文收益

`[推断]` harness 已把压缩定义成明确的“交给另一个 LLM 的 handoff”任务，并保存精确 replacement history 和 window lineage。较强模型若能更完整地保留约束、文件位置、验证证据和未完成边，会显著降低多次 compaction 后的漂移。源码自己的 accuracy warning 说明摘要损失仍是主要瓶颈。

### 13.2 Artifact-first 让长期记忆从神经上下文迁移到可验证状态

`[推断]` goal prompt 要求以当前 worktree 和外部状态为权威；fork 前 flush；terminal 前后 flush；resume 从 JSONL 和 DB 重建。模型若更主动生成 PRD、issue、测试、草稿版本和 checkpoint 文件，长任务会更稳，因为这些 artifact 不依赖摘要记忆。

### 13.3 任务拆解能力与有界并发互补

`[推断]` tool prompt 要求识别 critical path、并行 sidecar、disjoint write set 和少等待；registry、AgentPath、fork filter、mailbox 和 spawn edge 提供硬约束。模型规划提升会减少重复子任务、阻塞链和共享文件冲突；harness 防止容量泄漏和路由错误。

### 13.4 状态机遵循能力决定 `/goal` 的真实效果

`[推断]` 数据库能判断 active/budget_limited，无法自动判断“任务是否真正完成”。completion audit、blocked 三回合规则、预算 wrap-up 都通过 model-visible prompt 执行。更强的指令遵循、证据检索与自我校验直接提升跨 turn 完成率。

### 13.5 工具恢复能力降低偶发错误成本

`[推断]` rollout writer 重试、工具对 normalization、后台 process poll、resume reconstruction、mid-turn marker 和 thread index fallback 共同把局部故障转成可继续状态。模型若更善于读取错误、查当前状态并选择下一安全动作，工程恢复机制的收益更大。

### 13.6 缓存友好结构支持更长任务的成本与延迟

`[推断]` compaction 超窗时从最旧 history item 删除、fork full history 保留 reference baseline、synthetic output ID 稳定、ModelClientSession 在 turn/retry 内复用。这些选择减少 prompt cache 失效和 sticky routing 重建。源码能够证明结构意图，无法量化 Sol Ultra 的具体成本收益。

## 十四、可验证测试面

本地测试展示了长程机制的工程优先级：

| 机制 | 代表性测试 |
|---|---|
| rollout 落盘与恢复 | `rollout/src/recorder_tests.rs:488-831`：物化、失败重试、ordinal、tail repair |
| compact/resume/rollback | `core/src/session/rollout_reconstruction_tests.rs:298-1829`：完成与未完成回合、legacy/new checkpoint、window 与 WorldState |
| goal 并发结算与预算 | `ext/goal/tests/goal_extension_backend.rs:247-494`：tool finish、并发只计一次、budget limited 继续结算 |
| goal error/resume | `goal_extension_backend.rs:495-760`、`1010-1054`：usage limit、turn error、stale turn、resume rehydrate |
| multi-agent fork | `core/src/agent/control_tests.rs:913-1606`：sanitize、flush-before-read、LastNTurns、usage hints |
| multi-agent 容量与树恢复 | `agent/control_tests.rs:1709-1905`、`2393-3380` |
| V2 wait/mailbox | `tools/handlers/multi_agents_tests.rs:2978-3723`：timeout bounds、queued mail、wake、结果内容延迟交付 |
| Unified Exec | `core/src/unified_exec/mod_tests.rs:356-837`：跨请求进程、poll、timeout、terminate、远端 exec |
| TurnDiff | `core/src/turn_diff_tracker_tests.rs:54-431`：add/update/delete/move、多环境、cache、大 rewrite timeout |

`[边界]` 该审计没有运行这些 Rust 测试；证据来自当前 checkout 的实现与测试源码。测试存在证明维护者关注这些不变量，不能单独证明当前机器构建全部通过。

## 十五、已确认的局限与 unknown unknowns

1. **模型训练不可见**：本仓库没有 Sol Ultra 的预训练、SFT、RL、数据配比、grader、隐藏 benchmark 或推理服务实现。
2. **本地 fork 与线上版本可能漂移**：审计基于 2026-07-11 的指定 commit；服务端配置、feature flag 和模型 metadata 可能改变实际路径。
3. **rollout 无 fsync 证据**：`flush()` 能形成异步 I/O 屏障，断电 durability 未被证明。
4. **持久化错误会被局部吞掉**：普通 `persist_rollout_items` 只记日志；终点 barrier 提供后续告警窗口。
5. **compaction 有语义损失**：摘要遗漏不会自动从旧 JSONL 回灌；多次压缩 accuracy warning 是源码事实。
6. **goal 不是任意 task snapshot**：只存 objective/status/预算/用量/时间；细粒度步骤需要 artifact 或新 store。
7. **PlanUpdate 不 durable**：恢复后 checklist UI 没有 canonical reducer。
8. **mailbox 在消费前不 durable**：Agent graph 能恢复树关系，不能恢复未消费消息。
9. **Unified Exec 跨 restart 不恢复**：process ID 和 Arc handle 属于内存 manager。
10. **RolloutBudget 计数器不恢复**：提醒会保存，共享 weighted counter 没有 hydrate 路径。
11. **成功 completion 缺少同路径 hard cap**：error payload 有 1,000-token cap，successful final message 当前直接复制。
12. **token 估算是 lower bound**：pre-compaction 仍有 TODO，实际超窗可先到服务端才触发 fallback。
13. **goals DB 损坏缺少 rollout backfill**：独立数据库恢复会保留其他 DB，active goal 行可能丢失。
14. **共享工作树存在并行写冲突**：prompt 建议 disjoint write set，文件系统没有多 Agent 事务隔离。
15. **服务端 compact 是黑箱**：Remote/RemoteV2 本地只显示请求、retention 与安装结果，摘要生成细节无法审计。

## 十六、对长程 Agent harness 的设计提炼

`[推断]` 当前架构中最值得复用的设计原则如下：

1. **把状态按语义拆开**：conversation checkpoint、goal status、thread index、agent graph、process runtime 使用不同结构，避免一个“万能 memory blob”承担所有一致性责任。
2. **让追加日志成为恢复证据**：原始事件保留，模型可见历史通过 replacement checkpoint 投影；既能恢复，也能审计压缩前事实。
3. **在状态边界设置 flush barrier**：fork 前、terminal 前、terminal 后、中断 marker 后均有显式 barrier。
4. **用原子数据库更新处理预算**：用量累加与状态跃迁同一 SQL，expected goal ID 和 semaphore 处理 stale/concurrent writer。
5. **把不完整协议正规化**：缺失 tool output 补 `aborted`，mid-turn fork 补 interrupt boundary，legacy compaction 有兼容 replay。
6. **对并发先 reservation 后 commit**：失败自动回收容量与 path，Agent tree 能在持久 edge 上重建。
7. **让长操作可 yield**：后台 process handle 与 poll 把长命令变成多步交互，同时对 output、process 数和 timeout 设置硬上限。
8. **让完成成为证据命题**：goal prompt 要求逐项验证并保持原始 scope，减少模型把“已做一部分”误判为完成。
9. **显式暴露风险**：compaction accuracy warning、transient policy、token lower-bound 注释和恢复 fallback 都没有隐藏边界。

## 十七、直接回答：为何用户会观察到 Sol Ultra 长程表现提升

`[事实]` 当前源码证明 Codex 已具备一套为强模型准备的长程 harness：追加 rollout、精确 replacement history、跨 turn goal DB、预算结算、自动 continuation、fork-before-flush、AgentPath、mailbox/wait、线程图恢复、后台进程 poll、工具协议 normalization 和 completion audit。

`[推断]` 用户观察到的提升可以由以下组合解释：

- Sol Ultra 更擅长把复杂 objective 拆成可并行且不重叠的子任务；
- 更擅长在 compact handoff 中保留关键约束、状态和下一步；
- 更严格地遵循 goal 的“不缩小目标、证据化完成、严格 blocked”协议；
- 更愿意把状态外化到文件、计划、测试与子 Agent 结果；
- 更善于在 tool error、resume、budget steering 和 mailbox 交错时读取当前事实后继续。

这些模型能力会被 Codex harness 的持久化与恢复结构放大。模型能力单独存在时仍受 context loss 影响；harness 单独存在时仍无法判断任务语义完成。长程可靠性来自二者闭环。

`[边界]` “Sol Ultra 专项训练时具体见过什么、学习了什么”不在本地源码证据范围。任何关于内部训练数据、奖励模型、trajectory curriculum、hidden eval 或模型权重行为的具体描述，都需要标为官方披露或推测，不能从 Codex fork 反推为事实。

## 十八、后续研究建议

1. 对官方博客、system card、model release notes、Codex engineering posts 建立独立来源表，逐项映射本稿中的 harness 机制。
2. 对同一长程任务采集 Sol Ultra 与前代模型 rollout，比较 compaction summary 的约束召回率、子任务依赖错误、重复工具调用率和 resume 后首个正确动作率。
3. 检查实际 rollout 中 `compacted.replacement_history`、`ThreadGoalUpdated`、TurnAborted 和 agent spawn edge 的时间顺序，验证线上行为是否与当前 checkout 一致。
4. 为 PlanUpdate、mailbox、successful completion payload、RolloutBudget hydrate 和 goals DB backfill 设计专门 durability tests。
5. 用故障注入验证 crash point：JSONL queue 后/flush 前、goal SQL 后/event 前、fork flush 后/child materialize 前、mailbox enqueue 后/record 前。

---

### 审计口径说明

本稿专门解释 Codex 本地 harness 与架构。它不会把当前 checkout 的实现自动归因给 GPT-5.6 Sol Ultra，也不会把模型行为观察写成训练事实。需要引用本稿时，宜保留 `[事实]`、`[推断]`、`[边界]` 标签，避免在最终综合稿中丢失证据等级。
