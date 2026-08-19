# final-v2 源码独立复验

> 审查对象：[`final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md`](../final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)  
> 源码基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`，与复验时 `HEAD` 一致  
> 复验重点：Goal idle continuation、budget steering、Goal status 三种语义、RolloutBudget 默认开关与 delivery watermark、五条 token 路径、新增源码 line anchors  
> 方法：静态阅读 final-v2、Rust 实现、SQL、feature registry 与现有测试；未运行 Rust 测试  
> 结论：**P0 0 项，P1 0 项，P2 2 项。final-v2 已修复 final-v1 的全部源码级 P1，从源码事实角度可以交付；两个 P2 建议在最终发布前顺手修正。**

## 一、交付判断

final-v2 已准确完成以下关键修订：

1. 明确写出 Goal runtime 没有 tool-less continuation suppression，并还原 automatic idle continuation 的真实 gate。
2. 把 Goal budget steering 限定为 qualifying tool-finish crossing；turn stop/abort crossing 只做状态与 usage 结算。
3. 将 Goal status 拆为 automatic continuation、外部恢复和 metrics terminal transition 三套语义。
4. 明确 RolloutBudget 与 TokenBudget 都是 `UnderDevelopment`、默认关闭；weighted counter 与 delivery watermark 都没有 hydrate。
5. 五条 token 路径仍保持互相独立，权威状态、checkpoint 与停止语义没有再次混合。
6. 新增 A.1 高漂移源码索引；71 个本地 link/image occurrences 全部存在，27 个 `#L...` line anchors 全部位于目标文件有效行号范围内。

剩余两个 P2 不改变报告中心结论。P2-01 影响 usage-limit 路径的穷举精度；P2-02 影响 line-anchor 审计效率。

## 二、P0 findings

未发现 P0。

## 三、P1 findings

未发现 P1。

final-v1 的三项 P1 当前状态如下：

| final-v1 P1 | final-v2 状态 | 复验证据 |
|---|---|---|
| tool-less continuation suppression 主张错误 | **已修复**：[`第 233 行`](../final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L233) 明确说明不存在该门闩 | [`extension.rs:154-166`](../../../codex-rs/ext/goal/src/extension.rs#L154-L166)、[`runtime.rs:359-415`](../../../codex-rs/ext/goal/src/runtime.rs#L359-L415)、[`tasks/mod.rs:770-802`](../../../codex-rs/core/src/tasks/mod.rs#L770-L802)、[`inject.rs:45-132`](../../../codex-rs/core/src/session/inject.rs#L45-L132) |
| budget steering 被写成无条件动作 | **已修复**：执行摘要 [`第 32 行`](../final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L32) 与五路径表 [`第 259 行`](../final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L259) 均区分 tool finish 与 turn stop/abort | [`extension.rs:243-291`](../../../codex-rs/ext/goal/src/extension.rs#L243-L291)、[`extension.rs:359-402`](../../../codex-rs/ext/goal/src/extension.rs#L359-L402)、[`runtime.rs:417-487`](../../../codex-rs/ext/goal/src/runtime.rs#L417-L487) |
| 视觉 assets 与 v2 审计链接失效 | **已修复**：final-v2 引用的 assets、论文裁剪与 `visual-evidence-audit-v2.md` 均存在 | [`visual-evidence-audit-v2.md`](visual-evidence-audit-v2.md) |

## 四、P2 findings

### P2-01：usage-limit 表格漏写 BudgetLimited goal 也会转成 UsageLimited

- **final-v2 位置**：五路径表 [`第 261 行`](../final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L261)。
- **当前措辞**：持久结果为“active Goal 变 `usage_limited`”。
- **实际实现**：
  - terminal error 为 `UsageLimitExceeded` 时，Goal extension 进入 `ActiveGoalStopReason::UsageLimit`：[`extension.rs:296-319`](../../../codex-rs/ext/goal/src/extension.rs#L296-L319)。
  - `stop_active_goal_for_turn` 先结算 usage，再允许数据库状态为 `Active` 的 goal 转为 `UsageLimited`；当当前状态已经是 `BudgetLimited` 时，usage-limit 同样允许覆盖为 `UsageLimited`：[`runtime.rs:243-332`](../../../codex-rs/ext/goal/src/runtime.rs#L243-L332)。
  - 没有 tracked goal 时不会创建 Goal row；turn 仍以 terminal error 完成，`TurnComplete.error` 属于 rollout transcript：[`tasks/mod.rs:769-780`](../../../codex-rs/core/src/tasks/mod.rs#L769-L780)、[`protocol.rs:1956-1962`](../../../codex-rs/protocol/src/protocol.rs#L1956-L1962)。
- **影响**：当前表格把一种合法状态跃迁遗漏。总体“五路径”分类和“服务端决定恢复”结论仍然成立。

**可直接替换的表格行：**

> `| account/service usage limit | 服务端；存在 tracked goal 时另有 Goal SQLite | Active 或 BudgetLimited goal 变 usage_limited；terminal TurnComplete/error 进入 transcript | 没有 tracked goal 时不创建 Goal row；等待服务恢复或用户处理 |`

### P2-02：A.1 line anchors 全部有效，其中四组落点没有精确命中所声称的事实

- **final-v2 位置**：A.1 [`第 565–573 行`](../final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L565-L573)。
- **机械检查**：27 个 line anchors 的文件均存在，行号均未越界。
- **语义检查结果**：
  1. `config/mod.rs:1408` 只进入 V2 feature selection。默认 `4` 位于 [`config/mod.rs:208`](../../../codex-rs/core/src/config/mod.rs#L208)，根线程占位对应的 `saturating_sub(1)` 位于 [`config/mod.rs:1428-1441`](../../../codex-rs/core/src/config/mod.rs#L1428-L1441)。
  2. `spawn.rs:45` 落在 fork filter，不能直接证明 fork barrier。materialize/flush 位于 [`spawn.rs:464-466`](../../../codex-rs/core/src/agent/control/spawn.rs#L464-L466)。reservation 的 capacity 起点位于 [`registry.rs:79-97`](../../../codex-rs/core/src/agent/registry.rs#L79-L97)，nickname 位于 [`registry.rs:216-253`](../../../codex-rs/core/src/agent/registry.rs#L216-L253)，commit/Drop 位于 [`registry.rs:308-353`](../../../codex-rs/core/src/agent/registry.rs#L308-L353)。
  3. `rollout_reconstruction.rs:1` 只有 import，不能作为 manual/mid-turn initial-context 差异的交叉证据。可改用 [`compact.rs:123-146`](../../../codex-rs/core/src/compact.rs#L123-L146)、[`session/turn.rs:346-358`](../../../codex-rs/core/src/session/turn.rs#L346-L358)，或集成测试 [`compact.rs:4001`](../../../codex-rs/core/tests/suite/compact.rs#L4001) 与 [`compact.rs:4941`](../../../codex-rs/core/tests/suite/compact.rs#L4941)。
  4. `features/src/lib.rs:1235` 是 TokenBudget spec 起点。RolloutBudget spec 位于 [`features/src/lib.rs:1241-1245`](../../../codex-rs/features/src/lib.rs#L1241-L1245)。
- **影响**：链接可打开，读者仍需重新搜索才能验证行标题中的精确事实。正文事实本身均已通过复验。

**可直接替换 A.1 中四行的证据单元：**

| 主张 | 建议实现落点 | 建议测试或交叉证据 |
|---|---|---|
| V2 默认四 slot，根占一个；V2 depth 不受通用限制 | `config/mod.rs:208`、`config/mod.rs:1428`、`spec_plan.rs:343` | `multi_agents_tests.rs:2497` |
| spawn reservation、failed nickname 与 fork barrier | `registry.rs:79`、`registry.rs:216`、`registry.rs:308`、`spawn.rs:464` | `registry_tests.rs:163` |
| manual 与 mid-turn compaction 的 initial-context 差异 | `compact.rs:123`、`session/turn.rs:346`、`compact.rs:334` | `core/tests/suite/compact.rs:4001`、`core/tests/suite/compact.rs:4941` |
| RolloutBudget counter/reminder delivery 不 hydrate | `rollout_budget.rs:14`、`session/rollout_budget.rs:8` | `features/src/lib.rs:1241` |

## 五、重点语义复验

### 5.1 Goal idle continuation

**通过。** final-v2 的 gate 与源码一致：Goals/tool surface 可见、数据库状态 `Active`、live thread、无 active task、无 trigger-turn mailbox work、非 Plan mode。正常 turn stop 后会再次触发 idle lifecycle。runtime 没有记录“上一 continuation 是否调用工具”的字段或分支。

空转风险的停止条件也已写准：模型调用 `update_goal`，预算或 usage 状态结束 Active，terminal error 把 active goal 标为 Blocked，外部用户/系统暂停或修改状态。

### 5.2 Goal budget steering

**通过。** final-v2 已分开三层：

1. SQL usage/budget transition 是强制状态层。
2. `ThreadGoalUpdated` 是事件与审计层。
3. stop-new-work prompt 是 qualifying tool-finish crossing 的条件性 steering；它不硬禁用同 turn 工具。

turn stop/abort crossing 只结算并持久化终态，没有向已结束 turn 注入 steering 的路径。测试继续覆盖 BudgetLimited 后的 usage 累计：[`goal_extension_backend.rs:361-480`](../../../codex-rs/ext/goal/tests/goal_extension_backend.rs#L361-L480)。

### 5.3 Goal status 三种语义

**通过。** final-v2 [`第 237 行`](../final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L237) 已准确区分：

- automatic continuation 与 thread resume：只对 `Active` 生效；[`runtime.rs:335-415`](../../../codex-rs/ext/goal/src/runtime.rs#L335-L415)
- 外部恢复：Paused、Blocked、UsageLimited 可重新设为 Active；BudgetLimited 需要提高/移除预算并显式激活；Complete 允许创建新 goal；[`goals.rs:125-329`](../../../codex-rs/state/src/runtime/goals.rs#L125-L329)
- metrics：Blocked、UsageLimited、BudgetLimited、Complete 记为 terminal transition；[`metrics.rs:54-74`](../../../codex-rs/ext/goal/src/metrics.rs#L54-L74)

### 5.4 RolloutBudget

**通过。** feature registry 同时把 TokenBudget 与 RolloutBudget 标为 `UnderDevelopment`、默认关闭：[`features/src/lib.rs:1235-1245`](../../../codex-rs/features/src/lib.rs#L1235-L1245)。RolloutBudget 的 root-tree weighted counter 与 per-thread/window delivery map 都属于共享内存；已写入 history 的 reminder item和 terminal error 可进入 rollout，counter/delivery watermark 没有 hydrate。final-v2 的表格与风险条目均已反映这一边界。

### 5.5 五条 token 路径

**条件通过。** 五路径分类准确，P2-01 只修补 usage-limit 的状态穷举：

| 路径 | 复验结论 |
|---|---|
| 摘要式 auto compaction | 通过；replacement history 与 window chain 持久，baseline 依 initial-context injection 路径 |
| TokenBudget | 通过；默认关闭，无 summary fresh window，旧 messages 不进入新窗口，Compacted 后写 WorldState/TurnContext baseline |
| `/goal token_budget` | 通过；SQL transition 与条件性 steering 已分层 |
| RolloutBudget | 通过；默认关闭、root-tree memory state、no-hydrate 与可能重复 reminder 已写明 |
| account/service usage limit | P2；需要把 `BudgetLimited → UsageLimited` 与无 tracked goal 情况写全 |

## 六、最终验收

**源码复验结论：可交付。**

- P0：0
- P1：0
- P2：2
- 本地链接：71 个，缺失 0
- line anchors：27 个，行号越界 0；语义落点待精化 4 组
- final-v2 与旧稿：本轮未修改
- Rust 测试：未运行；该轮只审查文档与既有实现，没有代码变更

P2-01 与 P2-02 都有可直接替换的文本和落点。修正后，Goal、RolloutBudget、五路径与源码导航可以达到无保留源码验收。
