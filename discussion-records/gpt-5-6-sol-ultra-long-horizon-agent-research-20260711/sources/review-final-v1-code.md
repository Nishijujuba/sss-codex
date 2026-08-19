# final-v1 源码独立终审

> 审查对象：[`final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md`](../final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)  
> 源码基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`，与审查时 `HEAD` 一致  
> 审查范围：Codex V2 子 Agent 拓扑、rollout/compaction/Goal/Plan/Unified Exec、五条 token 路径、预算与自动续跑语义、本地源码与证据链接  
> 方法：静态阅读实现、SQL migration、prompt 与现有测试；未运行 Rust 测试  
> 结论：**P0 0 项，P1 3 项，P2 3 项。final-v1 的总体架构结论成立，Goal 自动续跑与 budget steering 仍有两处会改变运行时理解的事实偏差，视觉证据还有失效链接。**

## 一、结论先行

final-v1 已经正确吸收此前源码审查的大部分修订：

- V2 默认四个 session slot，根线程占一个；V2 忽略通用 `agent_max_depth`，子 Agent 可继续 spawn。
- failed spawn 会释放 capacity 与未提交 AgentPath，使用过的 nickname 保留到 pool reset。
- fork 前执行 materialize/flush；direct child completion 路由给直接父节点；`wait_agent` 的直接输出不携带完整 mailbox 内容。
- rollout ordinal、flush-before-metadata、reconstruction、manual/auto compaction 的 initial-context 差异均已写准。
- TokenBudget fresh-window checkpoint、Goal SQL usage transition、PlanUpdate transient、Unified Exec yield/poll/process cap 均已写准。
- successful completion payload 缺少 error payload 等价 hard cap 的风险判断成立。

当前阻止“源码无条件通过”的三项 P1 是：

1. final-v1 声称“无工具调用的 continuation 会抑制下一次自动续跑”；当前 Goal runtime 没有该门闩，正常结束后会再次触发 idle continuation。
2. final-v1 把 budget-limit steering 写成每次达限后的必然动作；当前 steering 只由符合计费条件的 `on_tool_finish` 路径注入，turn stop/abort 结算导致的 `budget_limited` 跃迁没有同类注入路径。
3. final-v1 嵌入的两张本地图片和两处 `visual-evidence-audit-v2.md` 链接当前均不存在；现存 v1 审计还明确记录“未完成下载、未经过 `view_image`”。

## 二、严重度定义

- **P0**：使中心结论失效，或造成直接安全、数据完整性错误。
- **P1**：会改变对运行时、恢复、限额或证据状态的理解，最终发布前应修正。
- **P2**：局部精度、状态术语、默认开关或审计可追溯性问题。

## 三、P0 findings

未发现 P0。

## 四、P1 findings

### P1-01：Goal 没有“continuation 未调用工具则抑制下一次续跑”的 runtime guard

- **final-v1 位置**：[`第 231 行`](../final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L231)。
- **现有主张**：无工具调用的 continuation 会抑制下一次自动续跑，防止空转。
- **实际实现**：
  - 每次 thread idle 都调用 Goal runtime 的 `continue_if_idle`：[`extension.rs:154-166`](../../../codex-rs/ext/goal/src/extension.rs#L154-L166)。
  - `continue_if_idle` 只检查 feature/tool 可见性、live thread 与数据库状态 `Active`，随后调用 `try_start_turn_if_idle`；函数中没有“上一 continuation 是否调用工具”的状态：[`runtime.rs:359-415`](../../../codex-rs/ext/goal/src/runtime.rs#L359-L415)。
  - 正常 turn stop 后，task 清空 active turn 并立即发出 thread-idle lifecycle：[`tasks/mod.rs:770-802`](../../../codex-rs/core/src/tasks/mod.rs#L770-L802)。
  - idle-turn gate 检查 active task、Plan mode 与 trigger-turn mailbox work；它没有检查上一回合 tool-call 数量：[`session/inject.rs:45-132`](../../../codex-rs/core/src/session/inject.rs#L45-L132)。
- **影响**：automatic continuation 若只输出文本、没有把 goal 更新为 complete/blocked，且预算与服务状态仍允许继续，下一次 idle lifecycle 会再启动 continuation。防空转依赖模型遵守 `update_goal` contract、预算跃迁或 terminal error；terminal error 路径会把 goal 标为 blocked，源码注释明确说明该动作防止错误循环：[`extension.rs:296-323`](../../../codex-rs/ext/goal/src/extension.rs#L296-L323)。

**可直接采用的精确措辞：**

> automatic continuation 需要 Goals 可见、数据库 goal 状态为 `Active`、live thread 当前无 active task、没有 trigger-turn mailbox work，且 collaboration mode 不为 Plan。每个正常 turn 结束并重新进入 idle 后，extension 都会再次尝试 continuation。当前 runtime 没有“上一 continuation 未调用工具则抑制下一次续跑”的门闩；停止循环依赖模型把 goal 更新为 complete/blocked、预算或 usage 状态跃迁，以及 terminal-error runtime 的阻断。

### P1-02：Goal budget-limit steering 是 tool-finish 条件路径，达限跃迁本身不保证注入

- **final-v1 位置**：执行摘要 [`第 32 行`](../final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L32) 与五路径表 [`第 255 行`](../final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L255)。
- **现有主张**：SQL 把 goal 转成 `budget_limited` 后，extension 随后向当前 turn 注入 steering。
- **实际实现**：
  - `on_tool_finish` 对符合计费条件、且工具名称不是 `update_goal` 的 tool attempt 结算 usage；首次观察到 `BudgetLimited` 后才构造并注入 steering：[`extension.rs:359-402`](../../../codex-rs/ext/goal/src/extension.rs#L359-L402)。
  - `on_turn_stop` 与 `on_turn_abort` 也会结算 usage 并触发同一 SQL transition，两个路径只调用 accounting，没有构造 budget-limit steering：[`extension.rs:243-291`](../../../codex-rs/ext/goal/src/extension.rs#L243-L291)。
  - steering 注入要求 turn 仍处于 active；无 active turn 时只记录 debug 日志：[`runtime.rs:417-428`](../../../codex-rs/ext/goal/src/runtime.rs#L417-L428)。
  - 每次成功 SQL 更新都会发 `ThreadGoalUpdated`，因此 status/usage durability 与 steering delivery 是两个独立事实：[`runtime.rs:431-487`](../../../codex-rs/ext/goal/src/runtime.rs#L431-L487)。
  - 测试证明进入 `budget_limited` 后，同一 turn 的后续 token/tool progress 仍继续累计：[`goal_extension_backend.rs:361-480`](../../../codex-rs/ext/goal/tests/goal_extension_backend.rs#L361-L480)。
- **影响**：Goal 的持久状态跃迁仍然成立。模型可见的“停止新增工作”指令只在 qualifying tool-finish crossing 中获得条件性保证；纯文本回合在 turn stop 才跨预算时，goal 会进入 `budget_limited` 并停止下一次 automatic continuation，已结束的 turn 不会收到该 steering。

**可直接替换执行摘要第 32 行：**

> 最符合“预算状态落盘”的路径是 Goal：单条 SQL 原子累计 usage，并在阈值条件满足时把 active goal 转成 `budget_limited`，同时发出 durable `ThreadGoalUpdated`。若该跃迁在符合计费条件的 tool-finish 边界首次被观察到，extension 会向仍活跃的 turn 注入 steering，要求停止新增实质工作并总结；若跃迁只在 turn stop/abort 结算时发生，则只持久化终态与 usage。steering 属于模型执行契约，runtime 不会立即禁用同一回合的所有工具，后续 usage 仍会结算。细粒度进展主要依赖 final response、rollout 或项目 Artifact。

**可直接替换五路径表的 Goal 行：**

> `| /goal token_budget | goals SQLite | budget_limited、累计 usage、ThreadGoalUpdated | qualifying tool-finish crossing 首次注入 stop-new-work steering；turn stop/abort crossing 只持久化终态；同 turn 工具没有 hard disable |`

### P1-03：视觉证据的四个本地链接失效，现存审计明确记录尚未视觉复核

- **final-v1 位置**：[`第 393 行`](../final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L393)、[`第 395 行`](../final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L395)、[`第 399 行`](../final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L399)、[`第 579 行`](../final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L579)。
- **链接审计**：final-v1 共发现 42 个本地 Markdown link/image occurrences，38 个目标存在，4 个目标不存在。缺失目标为：
  - `assets/gpt-5-6-system-card-figure-7-internaldep.png`
  - `assets/deployment-simulation-figure-1-production-resampling.png`
  - `sources/visual-evidence-audit-v2.md`，出现两次
- **现有证据状态**：当前目录只有 [`visual-evidence-audit.md`](visual-evidence-audit.md)。该文件开头与补验清单明确说明 assets 尚未下载、未经过 `view_image`，其中 Deployment Simulation 的计划文件名还是 `.svg`，与 final-v1 引用的 `.png` 不一致。
- **影响**：最终报告当前显示两个 broken image，并引用不存在的 v2 审计。视觉结论的保守文字仍可由官方相邻正文支持，报告不能把图像展示或视觉复核写成已完成事实。

**若本轮无法补齐图片与 v2 审计，可直接采用以下措辞并移除两条 image embed：**

> 两张官方视觉尚未完成本地下载与 `view_image` 复核。本节只采用官方相邻正文、图注、替代文本与论文直接支持的结论；图内独有数值、柱高、颜色、箭头和版面关系继续标为未知。证据状态与官方资源直链见视觉证据审计 v1（`sources/visual-evidence-audit.md`）。

**可直接替换第 579 行的视觉部分：**

> 视觉结论以视觉证据审计 v1（`sources/visual-evidence-audit.md`）为准；任何未完成本地下载与 `view_image` 复核的值继续标为未知。

若后续新增实际 assets 与 `visual-evidence-audit-v2.md`，需要重新执行本地链接检查，并确保 v2 明确记录每个文件的本地路径、尺寸与 `view_image` 复核结果。

## 五、P2 findings

### P2-01：RolloutBudget 与 TokenBudget 一样默认关闭，counter 与 reminder delivery 都不 hydrate

- **final-v1 位置**：五路径表 [`第 256 行`](../final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L256) 与风险 [`第 412 行`](../final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L412)。
- **问题**：报告明确写出 TokenBudget 默认关闭，没有给 RolloutBudget 相同限定。当前 feature registry 将两者都标为 `UnderDevelopment`、`default_enabled: false`：[`features/src/lib.rs:1235-1245`](../../../codex-rs/features/src/lib.rs#L1235-L1245)。
- **持久性补充**：RolloutBudget 的 weighted counter 与 per-thread/window reminder delivery map 都在共享内存中，从零/空初始化：[`rollout_budget.rs:14-105`](../../../codex-rs/core/src/rollout_budget.rs#L14-L105)。已插入 history 的 reminder 会作为 conversation item 进入 rollout；counter 与 delivery watermark 没有恢复路径：[`session/rollout_budget.rs:8-36`](../../../codex-rs/core/src/session/rollout_budget.rs#L8-L36)。

**可直接替换五路径表的 RolloutBudget 行：**

> `| RolloutBudget（UnderDevelopment，默认关闭） | root tree 共享内存 weighted counter 与 per-thread/window delivery map | 已写入 history 的 reminder item 与 terminal TurnComplete/error | 返回 SessionBudgetExceeded；counter 与 delivery watermark 未见 hydrate，restart 后可能重复 reminder |`

### P2-02：“terminal”一词混合了自动续跑、metrics 与外部可恢复三种语义

- **final-v1 位置**：[`第 233 行`](../final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L233)。
- **现有主张**：`BudgetLimited` 与 `Complete` 是 terminal；resume 只重新激活 Active。
- **问题**：
  - automatic continuation 和 thread resume 都只对 `Active` 生效：[`runtime.rs:335-415`](../../../codex-rs/ext/goal/src/runtime.rs#L335-L415)。
  - runtime accounting 会清除 Paused、Blocked、UsageLimited 与 Complete 的 active marker；BudgetLimited 是否立即清除取决于当前 accounting boundary：[`accounting.rs:424-438`](../../../codex-rs/ext/goal/src/accounting.rs#L424-L438)。
  - metrics 把 Blocked、UsageLimited、BudgetLimited 与 Complete 都记录为 terminal transition：[`metrics.rs:54-74`](../../../codex-rs/ext/goal/src/metrics.rs#L54-L74)。
  - app-server 测试把 Blocked 与 UsageLimited 明确称为 resumable stopped statuses：[`thread_resume.rs:1575-1664`](../../../codex-rs/app-server/tests/suite/v2/thread_resume.rs#L1575-L1664)。
  - BudgetLimited 在现有预算仍耗尽时会抵抗 pause/block/reactivate；更新或移除预算后可显式设回 Active。Complete 允许新 goal 覆盖旧 row：[`goals.rs:125-180`](../../../codex-rs/state/src/runtime/goals.rs#L125-L180)、[`goals.rs:198-329`](../../../codex-rs/state/src/runtime/goals.rs#L198-L329)。

**可直接采用的精确措辞：**

> automatic continuation 与 thread resume 都只重新激活数据库状态为 `Active` 的 goal。Paused、Blocked、UsageLimited 不自动续跑，外部用户或系统可把这些 stopped statuses 重新设为 Active。BudgetLimited 在 `tokens_used >= token_budget` 时保持预算终态；提高或移除预算并显式设为 Active 后可重新激活。Complete 允许创建新的 goal。metrics 将 Blocked、UsageLimited、BudgetLimited 与 Complete 都记为 terminal status transition。

### P2-03：核心 F2 链接大多停留在文件级，缺少实现与测试的 line anchors

- **现状**：除 P1-03 的四个缺失项外，其余本地链接均能解析。附录 A 的导航目标与当前目录结构一致。
- **风险**：V2 depth、Goal continuation、budget steering、TokenBudget replacement checkpoint 与 Unified Exec timeout 都是高漂移实现细节。文件级链接要求读者重新检索，难以快速确认报告绑定的 exact branch。
- **建议**：最终版可增加“claim → implementation span → test span”表。至少应覆盖本审查第六节列出的证据。链接仍需绑定当前 commit；行号只对该 commit 有效。

## 六、重点机制逐项通过表

| 主题 | 终审结果 | 精确源码证据 |
|---|---|---|
| V2 默认并发 | 通过：默认四 slot，根占一个，effective child capacity 为 `saturating_sub(1)` | [`config/mod.rs:1408-1441`](../../../codex-rs/core/src/config/mod.rs#L1408-L1441) |
| V2 depth | 通过：V1 检查 depth，V2 tool exposure 不受通用 depth 限制；测试覆盖嵌套 spawn | [`spec_plan.rs:343-351`](../../../codex-rs/core/src/tools/spec_plan.rs#L343-L351)、[`multi_agents_tests.rs:2497-2547`](../../../codex-rs/core/src/tools/handlers/multi_agents_tests.rs#L2497-L2547) |
| spawn reservation | 通过：capacity/nickname/path reservation；failed nickname 保留，未提交 path 释放 | [`registry.rs:79-97`](../../../codex-rs/core/src/agent/registry.rs#L79-L97)、[`registry.rs:216-353`](../../../codex-rs/core/src/agent/registry.rs#L216-L353)、[`registry_tests.rs:163-181`](../../../codex-rs/core/src/agent/registry_tests.rs#L163-L181) |
| fork barrier/filter | 通过：parent materialize + flush 后读取 snapshot，再按 fork mode 过滤 | [`spawn.rs:45-78`](../../../codex-rs/core/src/agent/control/spawn.rs#L45-L78)、[`spawn.rs:428-575`](../../../codex-rs/core/src/agent/control/spawn.rs#L428-L575) |
| direct-parent completion | 通过：V2 completion 进入直接父节点 input queue | [`control.rs:457-548`](../../../codex-rs/core/src/agent/control.rs#L457-L548)、[`control_tests.rs:2082-2164`](../../../codex-rs/core/src/agent/control_tests.rs#L2082-L2164) |
| `wait_agent` | 通过：基于 input-queue watch；直接输出只有 completed/interrupted/timed out | [`wait.rs:40-117`](../../../codex-rs/core/src/tools/handlers/multi_agents_v2/wait.rs#L40-L117)、[`wait.rs:133-195`](../../../codex-rs/core/src/tools/handlers/multi_agents_v2/wait.rs#L133-L195) |
| 持久 spawn graph/residency | 通过：非 ephemeral edge 入 SQLite；inactive child 可 unload/reload | [`0021_thread_spawn_edges.sql:1-8`](../../../codex-rs/state/migrations/0021_thread_spawn_edges.sql#L1-L8)、[`residency.rs:85-149`](../../../codex-rs/core/src/agent/control/residency.rs#L85-L149)、[`control_tests.rs:593-658`](../../../codex-rs/core/src/agent/control_tests.rs#L593-L658) |
| rollout line/flush | 通过：ordinal optional；live writer 在 metadata update 前等待 recorder flush | [`recorder.rs:1840-1847`](../../../codex-rs/rollout/src/recorder.rs#L1840-L1847)、[`live_writer.rs:114-140`](../../../codex-rs/thread-store/src/local/live_writer.rs#L114-L140) |
| rollout reconstruction | 通过：replacement checkpoint、rollback、incomplete turn 与后缀重放语义成立 | [`rollout_reconstruction.rs:1-369`](../../../codex-rs/core/src/session/rollout_reconstruction.rs#L1-L369) |
| local compaction | 通过：mid-turn 与 manual 的 `InitialContextInjection` 差异写准 | [`compact.rs:55-146`](../../../codex-rs/core/src/compact.rs#L55-L146)、[`compact.rs:334-367`](../../../codex-rs/core/src/compact.rs#L334-L367) |
| TokenBudget | 通过：无 summary fresh window；Compacted 后追加 full WorldState/TurnContext；默认关闭 | [`compact_token_budget.rs:20-89`](../../../codex-rs/core/src/compact_token_budget.rs#L20-L89)、[`session/mod.rs:3528-3558`](../../../codex-rs/core/src/session/mod.rs#L3528-L3558)、[`token_budget.rs:650-729`](../../../codex-rs/core/tests/suite/token_budget.rs#L650-L729) |
| Goal SQL | 通过：expected goal ID、原子 usage/budget transition 与 durable event 成立 | [`goals.rs:411-523`](../../../codex-rs/state/src/runtime/goals.rs#L411-L523)、[`runtime.rs:431-487`](../../../codex-rs/ext/goal/src/runtime.rs#L431-L487) |
| Goal prompt/runtime | 条件通过：三次 blocker 与 evidence completion 属于 prompt contract；handler 不验证；terminal error 可直接 blocked；见 P1-01、P1-02 | [`spec.rs:60-89`](../../../codex-rs/ext/goal/src/spec.rs#L60-L89)、[`tool.rs:221-290`](../../../codex-rs/ext/goal/src/tool.rs#L221-L290)、[`extension.rs:296-323`](../../../codex-rs/ext/goal/src/extension.rs#L296-L323) |
| PlanUpdate | 通过：handler 只发 event 与 `Plan updated`；rollout policy 将 event 设为 transient | [`plan.rs:20-95`](../../../codex-rs/core/src/tools/handlers/plan.rs#L20-L95)、[`policy.rs:117-174`](../../../codex-rs/rollout/src/policy.rs#L117-L174) |
| RolloutBudget | 条件通过：root tree 共享 counter、weighted usage、SessionBudgetExceeded 与 no-hydrate 成立；默认开关与 delivery watermark 见 P2-01 | [`rollout_budget.rs:14-105`](../../../codex-rs/core/src/rollout_budget.rs#L14-L105)、[`session/rollout_budget.rs:8-36`](../../../codex-rs/core/src/session/rollout_budget.rs#L8-L36) |
| usage limit | 通过：terminal error 会把 Active 或 BudgetLimited goal 转成 UsageLimited | [`runtime.rs:243-332`](../../../codex-rs/ext/goal/src/runtime.rs#L243-L332) |
| Unified Exec | 通过：每个 session manager 最多 64 processes；initial yield 30 秒；empty poll 默认 300 秒可配置；默认回复 10K tokens | [`unified_exec/mod.rs:64-73`](../../../codex-rs/core/src/unified_exec/mod.rs#L64-L73)、[`process_manager.rs:451-490`](../../../codex-rs/core/src/unified_exec/process_manager.rs#L451-L490)、[`process_manager.rs:710-719`](../../../codex-rs/core/src/unified_exec/process_manager.rs#L710-L719) |
| completion payload cap | 通过：error payload 截断到约 1K；Completed message 直接 clone，无等价 cap | [`session_prefix.rs:7-44`](../../../codex-rs/core/src/session_prefix.rs#L7-L44)、[`session_prefix_tests.rs:1-25`](../../../codex-rs/core/src/session_prefix_tests.rs#L1-L25) |

## 七、五条 token 路径的终审版表述

| 路径 | 开关/权威状态 | 达限后的实际行为 | 持久性边界 |
|---|---|---|---|
| 摘要式 auto compaction | active history + rollout Compacted | local/remote compaction 安装 replacement history 并推进 window chain | summary 有损；baseline 是否紧接 checkpoint 写入取决于 initial-context injection 路径 |
| TokenBudget | UnderDevelopment，默认关闭；context-window state | 跳过 summary，fresh-window initial context 替换 active history，旧 messages 不进入新窗口 | Compacted replacement/window chain 后写 full WorldState/TurnContext |
| `/goal token_budget` | Stable Goals feature；goals SQLite | SQL 原子累计 usage 并转 BudgetLimited；qualifying tool finish 首次注入 steering；turn stop/abort crossing 只结算终态 | status/budget/usage 与 ThreadGoalUpdated 持久；同 turn 工具没有 hard disable |
| RolloutBudget | UnderDevelopment，默认关闭；root-tree memory counter/delivery map | weighted output + non-cached input 达限后返回 SessionBudgetExceeded | reminder item 与 terminal event可进入 transcript；counter 与 delivery map 不 hydrate |
| account/service usage limit | 服务端限额 + goals SQLite | terminal error；Active 或 BudgetLimited goal 转 UsageLimited | Goal status 持久；配额恢复时间由服务端掌握 |

## 八、验收判断

final-v1 的中心答案可以保留：Sol Ultra 的长程能力来自模型、test-time compute、多 Agent 编排、上下文连续性、Codex 持久运行时、项目 Artifact 与验证/安全闭环的联合系统；当前公开证据无法给出私有 Ultra scheduler、完整训练配方或组件因果分解。

源码终审的发布门槛为：

1. 删除或修正“无工具 continuation suppression”主张。
2. 把 Goal budget steering 改成 tool-finish 条件路径，并区分 status durability 与 steering delivery。
3. 补齐两张实际图片与 v2 视觉审计，或移除 broken embeds 并明确维持 v1 未复核状态。
4. 补充 RolloutBudget 默认关闭及 reminder delivery 不 hydrate 的限定。
5. 将 Goal status 的 “terminal” 改为自动续跑、外部恢复与 metrics 三套明确语义。

满足以上条件后，V2、rollout、compaction、Plan、Unified Exec 与五路径架构部分可以按当前 commit 通过源码验收。
