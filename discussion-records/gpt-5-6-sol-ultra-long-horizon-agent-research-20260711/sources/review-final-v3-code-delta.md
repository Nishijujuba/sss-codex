# final-v3 相对 final-v2 的源码 delta 复验

> 审查对象：[`final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md`](../final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)  
> 对照版本：[`final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md`](../final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)  
> 源码基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`，与复验时 `HEAD` 一致  
> 审查范围：只检查 usage-limit 行、四组精确 line anchors、版本声明  
> 结论：**P0 0 项，P1 0 项，P2 0 项。`review-final-v2-code.md` 的两个 P2 已全部归零，final-v3 可以最终交付。**

## 一、delta 总结

final-v3 相对 final-v2 只包含本轮要求复验的三组源码相关变更：

1. usage-limit 表格行补齐 `Active`、`BudgetLimited` 与无 tracked goal 三种情况。
2. A.1 中四组语义落点不精确的 line anchors 已替换。
3. 页首、版本规则与页尾声明更新为 final-v3，并保留 final-v1、final-v2 与 v0–v3 草稿。

未发现该 delta 引入额外源码主张或回归。

## 二、P0 findings

未发现 P0。

## 三、P1 findings

未发现 P1。

## 四、P2 findings

未发现 P2。

## 五、两个既有 P2 的归零证据

### 5.1 usage-limit 状态穷举：已归零

final-v3 [`第 261 行`](../final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L261) 当前写明：

- 权威状态首先属于服务端；存在 tracked goal 时另有 Goal SQLite。
- `Active` 或 `BudgetLimited` goal 都可转为 `usage_limited`。
- terminal `TurnComplete/error` 进入 transcript。
- 没有 tracked goal 时不创建 Goal row。

该表述与实现一致：

- `UsageLimitExceeded` 映射到 `ActiveGoalStopReason::UsageLimit`：[`extension.rs:296-319`](../../../codex-rs/ext/goal/src/extension.rs#L296-L319)。
- runtime 允许 `Active → UsageLimited`，也允许 `BudgetLimited → UsageLimited`：[`runtime.rs:243-332`](../../../codex-rs/ext/goal/src/runtime.rs#L243-L332)。
- `TurnCompleteEvent` 保存可选 terminal error：[`protocol.rs:1956-1962`](../../../codex-rs/protocol/src/protocol.rs#L1956-L1962)。

**结论：`review-final-v2-code.md` 的 P2-01 已关闭。**

### 5.2 四组 line anchors：已归零

| 主张 | final-v3 新落点 | 复验结论 |
|---|---|---|
| V2 默认四 slot、根占一个、V2 depth | [`config/mod.rs:208`](../../../codex-rs/core/src/config/mod.rs#L208) 直接给出默认值 `4`；[`config/mod.rs:1428`](../../../codex-rs/core/src/config/mod.rs#L1428) 进入 effective child capacity；[`spec_plan.rs:343`](../../../codex-rs/core/src/tools/spec_plan.rs#L343) 与嵌套 spawn test 保持 | 通过 |
| spawn reservation、failed nickname、fork barrier | [`registry.rs:79`](../../../codex-rs/core/src/agent/registry.rs#L79)、[`registry.rs:216`](../../../codex-rs/core/src/agent/registry.rs#L216)、[`registry.rs:308`](../../../codex-rs/core/src/agent/registry.rs#L308) 分别定位 reservation、nickname、commit/Drop；[`spawn.rs:464`](../../../codex-rs/core/src/agent/control/spawn.rs#L464) 直接定位 flush-before-snapshot | 通过 |
| manual/mid-turn initial-context 差异 | [`compact.rs:123`](../../../codex-rs/core/src/compact.rs#L123)、[`session/turn.rs:346`](../../../codex-rs/core/src/session/turn.rs#L346)、[`compact.rs:334`](../../../codex-rs/core/src/compact.rs#L334) 定位两种注入路径与 replacement；[`compact.rs:4001`](../../../codex-rs/core/tests/suite/compact.rs#L4001)、[`compact.rs:4941`](../../../codex-rs/core/tests/suite/compact.rs#L4941) 定位两类 request-shape tests | 通过 |
| RolloutBudget feature registry | [`features/src/lib.rs:1241`](../../../codex-rs/features/src/lib.rs#L1241) 直接进入 RolloutBudget `FeatureSpec`，后续行给出 UnderDevelopment/default false | 通过 |

机械检查结果：final-v3 包含 76 个本地 link/image occurrences，缺失目标为 0；包含 32 个 `#L...` anchors，行号越界为 0。四组变更后的落点均能直接进入对应实现或测试上下文。

**结论：`review-final-v2-code.md` 的 P2-02 已关闭。**

## 六、版本声明复验

- 页首 [`第 3 行`](../final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L3) 标记“最终报告版本：v3”。
- 版本规则 [`第 8 行`](../final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L8) 声明 final-v3 为独立版本，没有覆盖 v0–v3 草稿、final-v1 或 final-v2。
- 页尾 [`第 618 行`](../final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md#L618) 再次声明独立 final-v3，并列出保留的旧版本与视觉证据版本。
- 当前工作区中 draft-v0、draft-v1、draft-v2、draft-v3、final-v1、final-v2、final-v3 七个报告文件均存在。

版本号、保留范围与当前文件状态一致。

## 七、最终可交付判断

**final-v3 可以最终交付。**

- P0：0
- P1：0
- P2：0
- `review-final-v2-code.md` 遗留项：2 项全部关闭
- 本地链接：76 个，缺失 0
- line anchors：32 个，越界 0；本轮四组语义落点全部通过
- 报告修改：本轮未修改 final-v3、final-v2 或任何旧稿
- 测试：未运行 Rust 测试；该轮只核对文档 delta 与既有源码
