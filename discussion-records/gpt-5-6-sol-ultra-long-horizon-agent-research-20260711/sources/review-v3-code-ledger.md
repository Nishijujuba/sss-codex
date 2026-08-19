# v3 Claim Ledger 源码事实复核

> 审查对象：`draft-v3-reviewed-claim-ledger.md`  
> 源码基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`，与当前 `HEAD` 一致  
> 审查范围：全部 33 条含 `F2` 的 claim、43 个本地相对链接、五条预算/限额路径，以及 V2 depth、Goal、WebSocket、TokenBudget replacement checkpoint、Code Mode/PTC 语义  
> 方法：静态源码、schema、migration 与现有测试交叉核对；未运行 Rust 测试  
> 结论：P0 0 项，P1 2 项，P2 5 项；26 条 F2 claim 可直接采用，7 条需要限定或补证据

## 一、结论先行

v3 已正确吸收 v1 源码审查中的主要修正：V2 当前忽略通用 `agent_max_depth=1`；TokenBudget 已成为第五条独立路径；Goal objective 的注入时机已经限定；三次 blocker/completion audit 已与 terminal-error runtime 分开；Code Mode/PTC 已降为设计同构推断。

最终版仍需修正两项 P1。C04 把 full WorldState/TurnContext baseline 写成所有本地摘要式 compaction 的共同持久化行为，manual/standalone compaction 明确走 `DoNotInject`。D03 把 Goal budget-limit steering 写成硬停止，当前 runtime 会在同一 turn 继续接受后续工具完成事件并累计 usage。

## 二、P1 findings

### P1-01：C04 把 mid-turn baseline 行为泛化到所有本地摘要式 compaction

- **v3 位置**：第 79 行，C04。
- **现有主张**：本地摘要式 compaction 持久化 replacement history、窗口链、full WorldState 与 TurnContext。
- **问题**：replacement history 与窗口链是共同行为。full WorldState 与 TurnContext baseline 取决于 `InitialContextInjection`。mid-turn auto compaction 使用 `BeforeLastUserMessage`，会立即持久化 full baseline；manual/standalone compaction 使用 `DoNotInject`，只安装 summary replacement history 并清空 reference context，下一次 regular turn 再完整重注入 initial context。
- **证据路径**：
  - `codex-rs/core/src/compact.rs:55-84`：两类 initial-context 策略的明确说明。
  - `codex-rs/core/src/compact.rs:123-146`：manual compaction 使用 `DoNotInject`。
  - `codex-rs/core/src/session/turn.rs:346-358`：mid-turn auto compaction 使用 `BeforeLastUserMessage`。
  - `codex-rs/core/src/compact.rs:334-367`：CompactedItem 与可选 baseline 的构造。
  - `codex-rs/core/src/session/mod.rs:3020-3058`：Compacted 总会持久化，WorldState/TurnContext 只在 `Some` 时追加。
- **最终版措辞**：

  > 摘要式 compaction 会安装并持久化带窗口链元数据的 `CompactedItem.replacement_history`。mid-turn auto compaction 还把 initial context 插入 replacement history，并紧接着持久化 full WorldState 与 TurnContext baseline。manual/standalone compaction 使用 `DoNotInject`；它先保存 summary replacement history 并清空 reference context，下一次 regular turn 再完整重注入初始上下文。

### P1-02：D03 的“停止新增实质工作”属于 steering contract

- **v3 位置**：第 91 行，D03。
- **问题**：SQL 会原子累计 usage 并把 active goal 转成 `budget_limited`。达到预算后，extension 向活跃 turn 注入 prompt，要求模型停止新实质工作并尽快总结。当前 handler 没有在状态变成 `budget_limited` 后硬禁用工具；测试明确覆盖同一 turn 后续 token/tool progress 继续累计。
- **证据路径**：
  - `codex-rs/state/src/runtime/goals.rs:411-523`：usage 与 budget transition 的单条 SQL。
  - `codex-rs/ext/goal/src/extension.rs:355-403`：tool finish 结算后注入 budget-limit steering，并以 `KeepActive` 保留当前 turn accounting。
  - `codex-rs/ext/goal/templates/goals/budget_limit.md:1-14`：停止新工作的要求位于 prompt。
  - `codex-rs/ext/goal/tests/goal_extension_backend.rs:361-433`、`437-480`：budget-limited 后继续累计至 turn stop 与后续 tool finish。
- **最终版措辞**：

  > `/goal token_budget` 达限时，单条 SQL 原子累计 usage 并把 goal 置为 `budget_limited`。extension 随后向当前 turn 注入 steering，要求模型停止新增实质工作、尽快总结进展与剩余项。该要求是模型执行契约；当前 runtime 不会立即硬终止同一 turn 的后续工具，后续 usage 仍会继续结算。

## 三、P2 findings

### P2-01：B04 的“非 input 属性一致”范围过宽

- **v3 位置**：第 65 行，B04。
- **问题**：复用检查比较 model、instructions、tools、tool choice、parallel flag、reasoning、store、stream、include、service tier、prompt cache key 与 text。`stream_options`、`client_metadata` 被明确忽略。input 前缀基线也包含上一请求 input 加服务端新增 response items，并在比较前清除内部 metadata。
- **证据路径**：`codex-rs/core/src/client.rs:303-359`、`1164-1252`。
- **最终版措辞**：

  > 当前 WebSocket 增量请求只在源码显式比较的 request properties 一致，且“上一请求 input + 服务端新增 response items”构成当前 input 的精确前缀时，才携带 `previous_response_id`。`stream_options` 与 `client_metadata` 被有意排除在该属性比较之外；sticky turn state 不跨 turn，物理 connection 可以进入 client cache。

### P2-02：D02 需要区分 replacement history 与后续 baseline 条目

- **v3 位置**：第 90 行，D02。
- **问题**：方向正确，当前“重放 initial context/WorldState/TurnContext”把模型活跃历史与 rollout baseline 混成一层。fresh-window reset 会用新构造的 initial-context items 替换活跃历史；`replace_compacted_history` 把这些 items 写入 `CompactedItem.replacement_history`，随后按顺序追加 full WorldState 和 TurnContext baseline。
- **证据路径**：
  - `codex-rs/core/src/compact_token_budget.rs:20-24`、`64-89`。
  - `codex-rs/core/src/session/mod.rs:3528-3558`：fresh-window 构造。
  - `codex-rs/core/src/session/mod.rs:3020-3058`：Compacted → WorldState → TurnContext 的持久化顺序。
  - `codex-rs/core/tests/suite/token_budget.rs:650-729`、`782-858`：旧 user/assistant/tool items 被清除，窗口链推进。
- **最终版措辞**：

  > feature-gated TokenBudget 达限时跳过 local/server summarization，建立 fresh context window，并用重新构造的 initial-context items 替换活跃历史。rollout 先保存含新 replacement history 与窗口链的 `CompactedItem`，随后保存 full WorldState 与 TurnContext baseline。旧 user、assistant 与 tool message items 不会进入新窗口。该 feature 在当前基线默认关闭。

### P2-03：F02 的 Drop rollback 不会回收失败 spawn 使用过的 nickname

- **v3 位置**：第 114 行，F02。
- **问题**：reservation 会预留 capacity、nickname 与 AgentPath。commit 会注册 metadata。Drop 会释放 capacity 与未提交 AgentPath；失败 spawn 的 nickname 会继续标为 used，直到 nickname pool reset。这是测试固定的当前行为。
- **证据路径**：
  - `codex-rs/core/src/agent/registry.rs:79-97`、`216-285`、`308-353`。
  - `codex-rs/core/src/agent/registry_tests.rs:74-80`：Drop 回收 slot。
  - `codex-rs/core/src/agent/registry_tests.rs:163-181`：失败 spawn 的 nickname 保持 used。
  - `codex-rs/core/src/agent/registry_tests.rs:307-321`：Drop 回收 path。
- **最终版措辞**：

  > spawn 先 reservation capacity、nickname 与 AgentPath，再在成功后 commit metadata。Drop 自动回收 capacity 与未提交 AgentPath；失败尝试使用过的 nickname 会保留为 used，直到 nickname pool reset，从而降低名称重复造成的混淆。

### P2-04：F04 的 migration 证据没有形成可点击相对链接

- **v3 位置**：第 116 行，F04。
- **问题**：事实成立，`state spawn-edge migration` 只是文字。该 claim 涵盖持久 edge、residency unload 与 rollout reload，需要补齐 migration、residency 与 reload test 三类证据。
- **证据路径**：
  - `codex-rs/state/migrations/0021_thread_spawn_edges.sql:1-8`。
  - `codex-rs/core/src/agent/control.rs:647-710`。
  - `codex-rs/core/src/agent/control/residency.rs:85-149`。
  - `codex-rs/core/src/agent/control_tests.rs:593-658`。
- **最终版措辞**：原 claim 可保留；直接证据栏应增加上述三个文件的相对链接，尤其是 `../../codex-rs/state/migrations/0021_thread_spawn_edges.sql`。

### P2-05：F05 的“活动摘要”高于当前 handler 实际输出

- **v3 位置**：第 117 行，F05。
- **问题**：等待本身确实基于 `InputQueueActivity` 的 watch channel，mailbox 或 steer 会结束等待。当前 handler 的直接结果只有 `Wait completed.`、`Wait interrupted by new input.` 或 `Wait timed out.`，没有列出具体哪些 Agent 有更新。实际消息内容通过 input queue/mailbox 进入后续模型输入。
- **证据路径**：`codex-rs/core/src/tools/handlers/multi_agents_v2/wait.rs:40-117`、`133-195`；工具描述位于 `codex-rs/core/src/tools/handlers/multi_agents_spec.rs:255`。
- **最终版措辞**：

  > `wait_agent` 通过 input-queue activity watch 事件驱动地等待 mailbox、user steering 或 timeout。tool output 只报告完成、steered 或 timed out；mailbox 的具体消息与 final-status 内容通过 pending input 进入模型上下文。

## 四、全部 F2 claim 核对表

| 区域 | Claim ID | 结果 | 备注 |
|---|---|---|---|
| A | A03 | 准确 | 372K、Code Mode only、V2、Responses Lite 均由 `models.json:4-27` 直接支持。 |
| A | A06 | 准确 | 默认 4 slots，V2 effective child capacity 为 `4 - 1`。 |
| A | A09 | 准确 | Ultra → Max 与 Proactive 的 V2/source/custom-hint 限定已写入。 |
| A | A10 | 准确 | `spec_plan.rs:343-351` 与 V2 nested-spawn test 直接支持。 |
| B | B02 | 准确 | Responses Lite 使用 `ReasoningContext::AllTurns`。 |
| B | B03 | 准确 | request 中 `parallel_tool_calls` 被置为 false，原因已保留为推断。 |
| B | B04 | 需 P2 修订 | 比较字段存在显式例外，prefix 还包含服务端新增 items。 |
| B | B05 | 准确 | 当前源码确实使用 `previous_response_id`；文章与源码属于不同时间点。 |
| B | B07 | 准确 | fresh V8、无 Node/fs/network/console、session-scoped store/load 均有直接实现；持久性边界准确。 |
| C | C01 | 准确 | timestamp + typed item；ordinal optional，legacy 可省略。 |
| C | C02 | 准确 | accepted live append 在 metadata 更新前等待 recorder flush。 |
| C | C03 | 准确 | RolloutItem 枚举覆盖完整。 |
| C | C04 | 需 P1 修订 | full WorldState/TurnContext baseline 只适用于注入 initial context 的路径。 |
| C | C05 | 准确 | reconstruction 采用最新存活 replacement checkpoint 与后缀；旧 JSONL 保留。 |
| C | C06 | 准确 | stable section ID 与 RFC 7386 merge patch 直接支持。 |
| C | C07 | 准确 | remote/server compaction 与本地模型摘要是独立执行路径，最终都可安装本地 replacement history。 |
| D | D01 | 准确 | 摘要式 auto compaction 使用 rollout checkpoint；local/remote 具体算法不同。 |
| D | D02 | 方向准确、需 P2 精化 | fresh window 与丢弃旧 messages 准确；checkpoint/baseline 分层需写清。 |
| D | D03 | 需 P1 修订 | DB transition 强制，停止新工作的行为由 steering prompt 约束。 |
| D | D04 | 准确 | root-tree 共享内存 counter、SessionBudgetExceeded、reminder 与 terminal TurnComplete 均成立；未见 hydrate 的限定合适。 |
| D | D05 | 准确 | UsageLimitReached 映射为 Goal `usage_limited`；服务恢复由服务端决定。 |
| E | E01 | 准确 | Goal 表字段与“不含细粒度步骤/证据列表”边界准确。 |
| E | E02 | 准确 | continuation 与 objective-update steering 被正确限定。 |
| E | E03 | 准确 | qualifying tool finish、turn stop/abort/error 会触发结算；SQL 原子处理 usage 与 budget transition。 |
| E | E04 | 准确 | completion/blocker audit 位于 prompt/tool contract，handler 不验证语义证据。 |
| E | E05 | 准确 | 非 usage-limit terminal error 可直接 system-block active goal。 |
| E | E06 | 准确 | PlanUpdate event transient，缺少 canonical reducer；“function call/output 可能留存”措辞审慎。 |
| F | F01 | 准确 | root tree 共享 AgentControl/registry/limiter/RolloutBudget。 |
| F | F02 | 方向准确、需 P2 精化 | reservation/commit 正确；Drop 对 nickname 的行为需单列。 |
| F | F03 | 准确 | fork 前 materialize+flush、snapshot 后过滤均有直接实现。 |
| F | F04 | 事实准确、证据栏需 P2 补齐 | 非 ephemeral edge 持久、unload/reload 均有实现与测试。 |
| F | F05 | 事件机制准确、输出措辞需 P2 修订 | handler 不返回具体 Agent 更新列表。 |
| F | F06 | 准确 | 64 processes、initial yield 30s、empty poll 默认 300s 可配置均正确。 |

## 五、五条预算/限额路径的最终版措辞

| 路径 | 权威状态 | 达限后的精确行为 | 持久性边界 |
|---|---|---|---|
| 摘要式 auto compaction | active history + rollout `CompactedItem` | local 或 remote summarization 后安装 replacement history 并推进窗口链 | summary 可能丢语义；baseline 是否随 checkpoint 立即写入取决于 initial-context injection 路径 |
| TokenBudget | context-window state + rollout checkpoint | 无摘要 fresh-window reset；新 initial context 替换活跃历史；旧 messages 被清除 | Compacted replacement history与窗口链先写，full WorldState/TurnContext baseline 随后写；feature 默认关闭 |
| `/goal token_budget` | goals SQLite | 原子累计 usage 并转 `budget_limited`；注入停止新工作的 steering | status/budget/usage 持久；steering 不是工具硬禁用；细粒度进展依赖 response/rollout/Artifact |
| RolloutBudget | root tree 共享内存 counter | 按 weighted output + non-cached input 达限后返回 `SessionBudgetExceeded` | reminder 与 terminal TurnComplete 可持久；weighted counter 未见从 JSONL/SQLite hydrate |
| account/service usage limit | 服务端限额 + goals SQLite | terminal error 映射为 active goal `usage_limited` | Goal status 持久；配额与恢复时间仍由服务端掌握 |

## 六、重点语义的最终版可采用段落

### V2 depth 与并发

> 当前 V2 默认提供 4 个 session slots，根 Agent 占其中 1 个，因此同一时刻最多有 3 个活跃子 Agent。通用 `agent_max_depth` 默认值为 1；V2 tool exposure 与 spawn handler 明确忽略该深度配置，测试覆盖了 depth-1 子 Agent 继续创建下一层 Agent。当前源码没有一层树深上限，实际并发仍受 slots、execution limiter 与 residency 约束。

### Goal prompt 与 runtime

> Goal objective、status、budget 与 usage 持久存在 SQLite。automatic idle continuation 会注入 objective，活跃回合中的 objective update 也会发送 steering；普通用户 turn 没有无条件重注入保证。三次相同 blocker 与 evidence-based completion 是模型 prompt/tool contract，handler 不核验 blocker 次数或外部证据。独立的 terminal-error runtime 路径可以直接把 active goal 标为 blocked。

### WebSocket

> `ModelClientSession` 保存 turn-scoped sticky state 与增量请求状态。只有显式比较的 request properties 一致，且上一请求 input 加服务端新增 items 构成当前 input 的精确前缀时，客户端才使用 `previous_response_id` 发送 delta。`stream_options` 与 `client_metadata` 不参与该属性比较。物理 WebSocket connection 可以缓存复用，sticky turn state 不得跨 turn。

### Code Mode 与 PTC

> 当前 Sol 本地配置为 Code Mode only。每个 exec cell 在 fresh V8 isolate 中运行，可编排显式暴露的 nested tools；运行时没有 Node、直接文件系统、直接网络或 console。`store/load` 在同一 code-mode session 的 cells 之间共享可序列化值，session 之间隔离，当前源码没有显示其进入 rollout 或 SQLite。公开 PTC 与本地 Code Mode 都减少逐次自然语言工具往返；两者是否共享 runtime、wire protocol、计费与服务端执行路径仍属未知。

## 七、相对路径与准确项

- v3 共包含 43 个本地 Markdown 链接、35 个唯一目标；全部目标存在，缺失数为 0。
- `F04` 的文字证据 `state spawn-edge migration` 没有形成链接，见 P2-04。
- v1 的 ordinal、V2 depth、Ultra Proactive 条件、Goal objective 注入、Goal audit/runtime、长命令 timeout、Code Mode/PTC 边界均已在 v3 中正确修订。
- 当前审查没有发现新的 P0、安全边界破坏、路径失效或数值阈值错误。
