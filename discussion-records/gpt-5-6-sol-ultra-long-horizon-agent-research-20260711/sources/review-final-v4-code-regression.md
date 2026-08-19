# final-v4 相对 final-v3 的源码回归快审

> 审查对象：[`final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md`](../final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)  
> 对照版本：[`final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md`](../final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)  
> 源码基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`，与快审时 `HEAD` 一致  
> 审查范围：官方/视觉措辞与版本号 delta；Goal、五条 token 路径和 32 个源码 anchors 的回归检查  
> 结论：**P0 0 项，P1 0 项，P2 0 项。final-v3 已归零的源码 findings 没有回退，final-v4 可以交付。**

## 一、结论先行

final-v4 相对 final-v3 的 delta 只涉及：

1. 页首与页尾版本从 final-v3 更新为 final-v4。
2. Figure 7 标题、PDF 双重页码、persistence 证据等级与视觉审计版本的精化。
3. Deployment Simulation 网页图与论文图关系的限定。

该 delta 没有修改 Goal、五条 token 路径、源码导航或 A.1 高漂移主张表。逐区块比较结果为：

- Goal 与五条路径区块：final-v3 / final-v4 逐字一致。
- 附录 A 与 A.1：final-v3 / final-v4 逐字一致。
- 32 个源码 line anchors：目标文件存在，行号越界 0。

## 二、P0 findings

未发现 P0。

## 三、P1 findings

未发现 P1。

## 四、P2 findings

未发现 P2。

## 五、源码回归检查

### 5.1 final-v3 已归零的两个源码 P2

| 既有 finding | final-v4 状态 | 回归结论 |
|---|---|---|
| usage-limit 状态穷举 | [`第 261 行`](../final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L261) 仍写明 `Active` 或 `BudgetLimited` goal 转 `usage_limited`，无 tracked goal 时不创建 row | 无回退 |
| 四组 line-anchor 语义落点 | [`第 565–571 行`](../final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L565-L571) 与 final-v3 相同 | 无回退 |

usage-limit 行继续符合 [`runtime.rs:243-332`](../../../codex-rs/ext/goal/src/runtime.rs#L243-L332) 与 [`protocol.rs:1956-1962`](../../../codex-rs/protocol/src/protocol.rs#L1956-L1962)。

### 5.2 五条 token 路径

**全部保持通过：**

| 路径 | final-v4 回归状态 |
|---|---|
| 摘要式 auto compaction | replacement history/window chain 与 initial-context baseline 限定未变 |
| TokenBudget | 默认关闭、无 summary fresh window、WorldState/TurnContext checkpoint 未变 |
| `/goal token_budget` | SQL transition、qualifying tool-finish steering、turn stop/abort 结算边界未变 |
| RolloutBudget | 默认关闭、counter/delivery memory state、no-hydrate 与重复 reminder 风险未变 |
| account/service usage limit | Active/BudgetLimited/无 tracked goal 三种情况未变 |

### 5.3 32 个源码 anchors

A.1 的 32 个 `#L...` anchors 与 final-v3 完全相同。重点落点继续有效：

- V2：[`config/mod.rs:208`](../../../codex-rs/core/src/config/mod.rs#L208)、[`config/mod.rs:1428`](../../../codex-rs/core/src/config/mod.rs#L1428)。
- spawn：[`registry.rs:79`](../../../codex-rs/core/src/agent/registry.rs#L79)、[`registry.rs:216`](../../../codex-rs/core/src/agent/registry.rs#L216)、[`registry.rs:308`](../../../codex-rs/core/src/agent/registry.rs#L308)、[`spawn.rs:464`](../../../codex-rs/core/src/agent/control/spawn.rs#L464)。
- Goal：[`runtime.rs:359`](../../../codex-rs/ext/goal/src/runtime.rs#L359)、[`extension.rs:243`](../../../codex-rs/ext/goal/src/extension.rs#L243)、[`extension.rs:359`](../../../codex-rs/ext/goal/src/extension.rs#L359)。
- compaction：[`compact.rs:123`](../../../codex-rs/core/src/compact.rs#L123)、[`session/turn.rs:346`](../../../codex-rs/core/src/session/turn.rs#L346)、[`compact.rs:334`](../../../codex-rs/core/src/compact.rs#L334)。
- RolloutBudget feature：[`features/src/lib.rs:1241`](../../../codex-rs/features/src/lib.rs#L1241)。

## 六、官方/视觉措辞 delta 对源码结论的影响

新增措辞把 Figure 7 的 persistence 关联标为图文联合 `I1`，并明确该图没有建立 persistence 对能力的独立因果贡献。Deployment Simulation 也从“两个图一致”收窄为“核心流程结构一致，编号、画风、节点文案与图注细节不同”。这些改动没有提出新的 Codex runtime、Goal、token budget 或 Agent graph 源码主张。

新增 [`visual-evidence-audit-v3.md`](visual-evidence-audit-v3.md) 链接存在。final-v4 的本地 link/image occurrences 为 77，缺失目标为 0。

## 七、版本声明

- 页首 [`第 3 行`](../final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L3) 标记最终报告版本 v4。
- 版本规则 [`第 8 行`](../final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L8) 声明保留 v0–v3 草稿与 final-v1–final-v3。
- 页尾 [`第 618 行`](../final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L618) 再次声明独立 final-v4，并把视觉证据当前版本更新为 v3。
- 当前工作区中 v0–v3 草稿、final-v1、final-v2、final-v3 与 visual audit v1–v3 均存在。

版本号、保留范围和当前文件状态一致。

## 八、可交付判断

**final-v4 可以交付。**

- P0：0
- P1：0
- P2：0
- 五条 token 路径：无回退
- 源码 anchors：32 个，缺失 0，越界 0
- final-v4 全部本地链接：77 个，缺失 0
- 文件修改：本轮未修改 final-v4、final-v3 或旧稿
- 测试：未运行 Rust 测试；该轮只做文档 delta 与源码引用回归检查
