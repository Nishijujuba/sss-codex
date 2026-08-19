# v1 源码事实独立审查

> 审查对象：`draft-v1-source-synthesis.md`  
> 源码基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`，与当前 `HEAD` 一致  
> 审查范围：全部 8 条显式 `F2` 主张，以及 Goal、RolloutBudget、TokenBudget、PlanUpdate、多 Agent、WebSocket、Code Mode/PTC 和长命令语义  
> 方法：静态源码与现有测试交叉核对；未运行 Rust 测试  
> 结论：P0 0 项，P1 4 项，P2 8 项

## 一、结论先行

v1 的主架构方向成立，WorldState、PlanUpdate、rollout flush、Responses Lite 请求字段、Goal SQLite 原子结算、RolloutBudget 共享计数和 WebSocket 增量请求等核心描述都有源码支撑。四项 P1 会直接改变读者对长程执行保证的理解：V2 当前没有“一层最大深度”这一源码契约；独立的 `TokenBudget` 路径被遗漏；Goal objective 只在特定 steering/continuation 路径注入；Goal 的 complete/blocked 审计主要依赖模型指令，terminal error 还能由 runtime 直接把 goal 标为 blocked。

## 二、P1 findings

### P1-01：V2“默认最大深度为一层”与当前测试相反

- **v1 位置**：第 56 行。
- **问题**：`DEFAULT_AGENT_MAX_DEPTH = 1` 属于通用/旧路径配置。V2 测试把 `agent_max_depth` 设为 1 后，深度为 1 的子 Agent 仍成功创建 `/root/parent/child`。V2 usage hint 与工具描述也明确说明子 Agent 可以继续 spawn。
- **证据**：
  - `codex-rs/core/src/config/mod.rs:268`
  - `codex-rs/core/src/config/mod.rs:212-237`
  - `codex-rs/core/src/tools/handlers/multi_agents_tests.rs:2497-2547`
  - `codex-rs/core/src/tools/handlers/multi_agents_spec.rs:722-730`
- **建议修订**：写成“V2 默认并发槽位为 4，根 Agent 占 1 个，因此同时最多有 3 个活跃子 Agent。通用 `agent_max_depth` 默认值为 1；当前 V2 spawn 路径明确忽略该配置，当前源码没有给出一层深度上限。”

并发数本身核对通过：`DEFAULT_MULTI_AGENT_V2_MAX_CONCURRENT_THREADS_PER_SESSION = 4`，V2 的有效子线程数使用 `saturating_sub(1)`，证据位于 `codex-rs/core/src/config/mod.rs:208`、`1428-1441`。

### P1-02：“token 限额至少四条路径”遗漏独立 TokenBudget

- **v1 位置**：第 85-111 行。
- **问题**：当前源码同时存在 `TokenBudget` 与 `RolloutBudget` 两个独立 feature。`TokenBudget` 是 context-window 预算策略；达到阈值后跳过模型/服务端摘要，直接建立 fresh context window。当前窗口的 message items 会被清除，initial context、WorldState、TurnContext 与窗口链元数据会重新落入 replacement checkpoint。该行为与 v1 A 节描述的摘要式 compaction 存在关键差异。
- **证据**：
  - `codex-rs/core/src/config/mod.rs:1038-1041`：两个预算的定义分离。
  - `codex-rs/features/src/lib.rs:1235-1245`：两者均为 under-development、默认关闭。
  - `codex-rs/core/src/session/turn.rs:955-975`：启用 `Feature::TokenBudget` 时走专用 compact 路径。
  - `codex-rs/core/src/compact_token_budget.rs:20-24`、`44-48`、`64-89`：无摘要 fresh-window 生命周期。
  - `codex-rs/core/src/session/mod.rs:3528-3558`：重建 initial context，并持久化 Compacted、full WorldState 与 TurnContext。
  - `codex-rs/core/src/config/mod.rs:1089-1109`：默认 reminder 明示 message items 清除、notes/history 跨窗口保留。
  - `codex-rs/core/src/tools/handlers/new_context_window.rs:13-40`：显式 new-context 工具同样说明不做 conversation summary。
- **建议修订**：把“至少四条”改为“至少五条”，新增独立小节：`TokenBudget` 是 feature-gated 的上下文窗口重置机制，不是全局消费上限，也不是 `/goal token_budget` 或共享 `RolloutBudget`。同时把 A 节限定为“TokenBudget 未启用时的 local/remote summarizing compaction 路径”。

### P1-03：Goal objective 并非每个普通回合无条件重复注入

- **v1 位置**：第 137 行。
- **问题**：源码只证明两类 objective steering：active goal 的 idle continuation 会把 objective 放入自动新回合；活跃回合中修改 objective 会注入 update steering。普通用户回合的 `on_turn_start` 只初始化 accounting 与记录 active goal ID，没有注入 objective。压缩后能否再次看到 objective 取决于后续是否触发 continuation、objective update，或 objective 已进入保留历史。
- **证据**：
  - `codex-rs/ext/goal/src/extension.rs:154-166`：idle hook 调用 continuation。
  - `codex-rs/ext/goal/src/runtime.rs:359-415`：仅 active goal 的 automatic idle turn 使用 continuation item。
  - `codex-rs/ext/goal/src/steering.rs:45-76`：continuation prompt 包含 objective。
  - `codex-rs/ext/goal/src/runtime.rs:189-208`：objective 更新时注入 live-turn steering。
  - `codex-rs/ext/goal/src/extension.rs:201-240`：普通 turn start 没有 objective 注入。
- **建议修订**：写成“objective 持久保存在 goals SQLite；automatic continuation 会重新注入 objective，活跃回合中的 objective update 也会发送 steering。当前源码没有证明每个普通用户回合都会无条件重复注入 objective。”

### P1-04：complete/blocked 审计被表述成 runtime 强制不变量

- **v1 位置**：第 140-141 行。
- **问题**：三次 blocker 与 completion audit 是工具 schema、developer prompt 对模型的行为契约。`update_goal` handler 校验 status 枚举后直接写库，没有统计 blocker 次数，也没有验证测试或工件证据。另有一条独立系统路径：任意非 usage-limit terminal error 会立即把 active goal 更新为 `blocked`，无需等待三次相同 blocker。
- **证据**：
  - `codex-rs/ext/goal/src/spec.rs:60-89`：三次 blocker 与 complete 条件位于工具说明。
  - `codex-rs/ext/goal/templates/goals/continuation.md:30-51`：completion/blocked audit 位于 prompt。
  - `codex-rs/ext/goal/src/tool.rs:221-290`：handler 只限制为 Complete/Blocked 并直接更新状态。
  - `codex-rs/ext/goal/src/extension.rs:299-323`：terminal error 进入系统 stop 路径。
  - `codex-rs/ext/goal/src/runtime.rs:243-332`：`TurnError` 直接映射为 `ThreadGoalStatus::Blocked`。
- **建议修订**：把两条改成“Goal prompt 严格要求模型在三次相同 blocker 后才调用 `update_goal(blocked)`，并在证据审计后才调用 `update_goal(complete)`；handler 本身不验证这些语义条件。独立的 terminal-error runtime 路径可直接把 active goal 标为 blocked。”

## 三、P2 findings

### P2-01：rollout ordinal 不是每行必有字段

- **v1 位置**：第 75 行。
- **问题**：`ordinal` 类型为 `Option<u64>`，`None` 时省略。legacy rollout 与恢复的空 legacy rollout 测试均明确断言没有 ordinal。
- **证据**：`codex-rs/rollout/src/recorder.rs:1840-1847`；`codex-rs/rollout/src/recorder_tests.rs:591-642`。
- **建议修订**：写成“每行包含 timestamp 与 typed `RolloutItem`；paginated rollout 另外带 ordinal，legacy rollout 可以省略。”

### P2-02：spawn 主张成立，当前引用没有覆盖 reservation/rollback

- **v1 位置**：第 58 行。
- **问题**：materialize、flush 与 history filter 位于已链接的 `spawn.rs`；容量、nickname、AgentPath reservation、commit 与 Drop rollback 的核心实现位于 `agent/registry.rs`。
- **证据**：`codex-rs/core/src/agent/control/spawn.rs:45-78`、`460-562`；`codex-rs/core/src/agent/registry.rs:79-97`、`308-353`。
- **建议修订**：给该 `F2` 增加 `agent/registry.rs` 链接。事实正文可保留。

### P2-03：Ultra → Proactive 的触发条件需要限定

- **v1 位置**：第 40 行。
- **问题**：Ultra → Max 的 request 映射成立。Proactive mode 只在 V2、没有自定义 `multi_agent_mode_hint_text`、且 session source 属于允许集合时生效；部分 Internal/SubAgent source 返回 `None`。
- **证据**：`codex-rs/core/src/client.rs:174-178`；`codex-rs/core/src/session/multi_agents.rs:39-67`。
- **建议修订**：增加“在 V2、未配置 custom hint 且 session source 允许时”的限定语。

### P2-04：Responses Lite 的字段事实与并发原因推断混在同一条 F2

- **v1 位置**：第 119 行。
- **问题**：源码直接证明 `ReasoningContext::AllTurns` 与 `parallel_tool_calls = false`。源码没有在该处说明关闭原因是 Code Mode/PTC 与 V2 collaboration 承担并发。
- **证据**：`codex-rs/core/src/client.rs:805-820`、`890-905`。
- **建议修订**：保留两个请求字段为 `F2`；把“并发主要由……”单列为 `I1`，并引用 Code Mode 与 collaboration 的实现证据。

### P2-05：本地 Code Mode 与公开 PTC 仍缺少源码级等价证明

- **v1 位置**：第 127-131 行。
- **问题**：fresh V8 isolate、显式 nested tools、并发编排、无 Node/fs/network/console、同 session 的 `store/load` 共享均有源码支撑。仓库没有把该实现命名为 PTC，也没有给 `store/load` 设定“小型值”的明确大小上限。stored values 是 code-mode session 内存状态；源码没有显示其进入 rollout 或 SQLite。
- **证据**：`codex-rs/code-mode-protocol/src/description.rs:12-35`；`codex-rs/code-mode-protocol/src/session.rs:107-133`；`codex-rs/code-mode/src/service_tests.rs:125-182`。
- **建议修订**：把“本地 Code Mode 实现事实”标为 `F2`；把“它与官方 PTC 的对应关系及往返收益”分别标为 `F1/I1`。把“小型”改成“可序列化”，并明确 session 内存不构成跨进程持久化。

### P2-06：“V2 developer instruction 很短”只适用于 proactive mode fragment

- **v1 位置**：第 237 行。
- **问题**：Proactive 授权片段确实很短。V2 还会注入 root/subagent/shared usage hints，spawn tool description 也包含 canonical path、fork context 与 bounded-task 约束。总 multi-agent prompt surface 明显多于一条短指令。
- **证据**：`codex-rs/core/src/context/multi_agent_mode_instructions.rs:6-40`；`codex-rs/core/src/config/mod.rs:212-261`；`codex-rs/core/src/tools/handlers/multi_agents_spec.rs:711-740`。
- **建议修订**：写成“effort-derived Proactive 授权片段很短；完整 V2 协议还由 usage hints、typed tool descriptions 与 runtime invariants 共同表达。”

### P2-07：长命令 timeout 的“硬上限”表述过宽

- **v1 位置**：第 233 行。
- **问题**：后台进程数有 64 的硬上限，initial yield 有 30 秒硬上限。空 `write_stdin`/poll 的最大等待由 `background_terminal_max_timeout` 配置，默认 300 秒；配置加载只设置下限，没有源码级固定最高值。
- **证据**：`codex-rs/core/src/unified_exec/mod.rs:64-73`、`139-151`；`codex-rs/core/src/unified_exec/process_manager.rs:710-719`；`codex-rs/core/src/config/mod.rs:3530-3533`。
- **建议修订**：分别写明“64 个进程硬上限、initial yield 最大 30 秒、空 poll 默认最多 300 秒且可配置”。

### P2-08：budget_limited 的详细进展没有独立持久化保证

- **v1 位置**：第 142 行。
- **问题**：budget-limit prompt 要求模型在当前 turn 中总结进展、剩余工作、blocker 与 next step。goals SQLite 持久化的是 objective、status、budget 与 usage；详细进展仍依赖 final response/rollout 或项目 Artifact。
- **证据**：`codex-rs/ext/goal/templates/goals/budget_limit.md:1-14`；`codex-rs/state/goals_migrations/0001_thread_goals.sql:1-18`。
- **建议修订**：把“记录进展”写成“在结束当前 turn 前向用户总结进展”；紧接着说明详细恢复点需要 rollout 或 Artifact。

## 四、逐条 F2 核对表

| v1 行 | 核对结果 | 说明 |
|---:|---|---|
| 38 | 通过 | `models.json:4-27` 直接给出 372000、code_mode_only、V2、Responses Lite。 |
| 40 | 部分通过 | Ultra → Max 通过；Proactive 需补 P2-03 的 feature/source/config 条件。 |
| 56 | 部分通过 | 4 槽、根占 1 槽、共享 AgentControl/registry/limiter/RolloutBudget 通过；一层深度错误，见 P1-01。 |
| 58 | 事实通过、引用不完整 | flush/filter 与 reservation/rollback 均成立，见 P2-02。 |
| 75 | 部分通过 | append JSONL 与 flush-before-metadata 通过；ordinal 并非每行必有，见 P2-01。 |
| 77 | 通过 | `RolloutItem` 枚举、稳定 section ID、RFC 7386 merge patch 均有直接实现。 |
| 79 | 通过 | handler 只发 PlanUpdate；rollout policy 把它列入 transient，缺少 canonical store 的结论成立。 |
| 119 | 字段通过、因果需降级 | AllTurns 与关闭普通 parallel tool calls 通过；原因句应标为推断，见 P2-04。 |

## 五、数值、路径与重点语义核对

### 数值阈值

- 372,000：通过，`codex-rs/models-manager/models.json:25-27`。
- 95% 与约 353,400：通过，默认比例位于 `codex-rs/protocol/src/openai_models.rs:348-349`，应用公式位于 `codex-rs/core/src/session/turn_context.rs:192-199`。
- 90% 与约 334,800：通过，`auto_compact_token_limit()` 位于 `codex-rs/protocol/src/openai_models.rs:406-462`。
- V2 4 槽、同时最多 3 个子 Agent：通过，`codex-rs/core/src/config/mod.rs:208`、`1428-1441`。
- Goal token delta 为非缓存输入加输出：通过，`codex-rs/ext/goal/src/accounting.rs:313-333`。

### Goal、三类预算与 PlanUpdate

| 机制 | 权威状态 | 是否跨进程 | 达限行为 | v1 结论 |
|---|---|---:|---|---|
| `/goal token_budget` | goals SQLite | 是 | 原子累计并转 `budget_limited`，发持久 `ThreadGoalUpdated` | 核心描述通过；注入与 complete/blocked 语义需按 P1-03/P1-04 修订 |
| `RolloutBudget` | root tree 共享内存计数器 | 未见 hydrate | `SessionBudgetExceeded`；reminder 与带 error 的 TurnComplete 可进入 rollout | 核心描述通过；“未见 hydrate”属于当前源码范围内的审慎结论 |
| `TokenBudget` | context-window 状态与 rollout checkpoint | 窗口 checkpoint 持久；提醒 claim 等运行态细节另论 | 无摘要 fresh-window reset | v1 遗漏，见 P1-02 |
| `PlanUpdate` | UI event | 否 | 无预算行为 | transient 结论通过 |

### WebSocket

主语义核对通过：`ModelClientSession` 是 turn-scoped；sticky token 不得跨 turn；增量请求需要非 input 属性匹配，并使用 `previous_response_id`。精确实现还包含两点：前缀基线由“上一请求 input + 服务端新增 response items”组成；`stream_options` 与 `client_metadata` 被有意排除在复用属性比较之外。物理 WebSocket connection 可以在 `ModelClientSession::drop` 后进入 client cache，turn-scoped 的是 sticky state 与 incremental request state。证据位于 `codex-rs/core/src/client.rs:259-359`、`1106-1111`、`1164-1252`。

### 链接

审查脚本解析到 17 个本地 Markdown 链接、16 个唯一目标；全部目标存在，缺失数为 0。P2-02 属于证据覆盖范围不足，路径本身有效。

## 六、明确无问题项

1. `RolloutItem` 类型集合与 WorldState full/patch 模型准确。
2. `update_plan` 的 transient 性质准确；它没有 Goal 同级的恢复保证。
3. live writer 在 SQLite metadata 更新前等待 recorder flush 的顺序准确。
4. root session tree 共享 `AgentControl`、`AgentRegistry`、execution limiter 与 `RolloutBudget` 的描述准确，证据位于 `codex-rs/core/src/agent/control.rs:88-107`。
5. Goal 表字段、状态枚举、expected goal ID 防旧回合污染、原子 usage 累加与 budget transition 准确，证据位于 `codex-rs/state/goals_migrations/0001_thread_goals.sql:1-18`、`codex-rs/state/src/runtime/goals.rs:411-523`。
6. usage-limit 会把 active goal 转为 `usage_limited` 的描述准确，证据位于 `codex-rs/ext/goal/src/extension.rs:299-323`、`codex-rs/ext/goal/src/runtime.rs:238-332`。
7. resume 只恢复 Active goal 的 accounting/continuation 资格，BudgetLimited 不会自动激活，证据位于 `codex-rs/ext/goal/src/runtime.rs:335-356`。
8. Code Mode 的 fresh isolate、显式工具边界、同 session store/load 共享语义准确；其持久性边界需按 P2-05 表达。

## 七、不确定项与源码证明边界

1. 当前 checkout 无法证明服务端 Responses Lite、remote compaction、prompt caching 与 persisted reasoning 的全部内部实现。
2. 当前 checkout 无法证明本地 Code Mode 与公开 API 所称 PTC 在协议、训练或服务端执行层完全等价。
3. 当前源码证明 `RolloutBudget.weighted_tokens_used` 从 0 初始化，未发现 JSONL/SQLite hydrate；该结论属于“未见实现”，不能排除 checkout 外的产品层恢复逻辑。
4. Goal objective 在 compaction 后的可见性取决于保留历史与后续 steering/continuation；没有每个普通回合强制注入的源码保证。
5. model metadata、feature rollout 与 desktop 构建可随服务端或版本变化；本文件只审查指定 commit。
6. mailbox durable queue、后台进程跨应用重启、所有 flush 路径的 `fsync` 强度仍缺少当前源码中的完整端到端保证。v1 已把这些内容列为风险，风险措辞保持合适。
