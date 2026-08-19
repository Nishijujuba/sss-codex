# final-v3 快速最终验收

> 验收对象：[final-v3](../final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)  
> 基准版本：[final-v2](../final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)  
> 验收标准：[75 项 checklist 与 13 项 No-Go](final-report-structure-and-acceptance.md)  
> 验收日期：2026-07-12（Asia/Shanghai）  
> final-v3 SHA-256：`DDD4F92ACF514F7E31AB8A7774081EE1280163F4CC191884E75E95822320C61B`  
> 操作边界：本验收没有修改 final-v3、final-v2、final-v1 或 v0–v3 草稿。

## 一、结论

**final-v3 通过最终验收，可以交付。**

- P0：0
- P1：0
- P2：0
- Checklist：`75 / 75 通过`
- No-Go：`13 / 13 通过`
- 本地链接：`76 个引用 / 68 个唯一目标 / 0 缺失 / 0 越界行号`
- 历史版本：final-v1、final-v2、v0–v3 均存在且 hash 未改变

## 二、v2 → v3 增量范围

diff 只包含三类变化：

1. **版本元数据**：`v2 → v3`，并把 final-v2 加入“不覆盖历史版本”的声明。
2. **源码 P2 修订**：usage-limit 路径补齐 `BudgetLimited → UsageLimited` 和“无 tracked goal 时不创建 Goal row”。
3. **源码导航 P2 修订**：四组行号落点改到真正承载所述事实的实现或测试位置。

评测数字、八项选择偏差矩阵、Terminal 对照、16-agent 边界、训练分层、三项用户回答、视觉章节、风险、消融和最终结论均未发生内容变化。

## 三、源码 P2 修订核对

### 3.1 usage-limit 路径

**通过。** final-v3 第 261 行现已写明：

- 权威状态首先位于服务端；存在 tracked goal 时另有 Goal SQLite。
- `Active` 或 `BudgetLimited` goal 均可转为 `usage_limited`。
- terminal `TurnComplete/error` 进入 transcript。
- 没有 tracked goal 时不会创建 Goal row。
- 服务恢复仍由服务端决定。

该措辞与 [final-v2 源码复验](review-final-v2-code.md) 的 P2-01 建议完全一致，没有改变五条路径的分类和主结论。

### 3.2 line anchors

**通过。** 附录 A.1 的四组修订分别是：

| 主张 | final-v3 精确落点 |
|---|---|
| V2 四 slot、根占一个、depth 不受通用限制 | `config/mod.rs:208`、`:1428`、`spec_plan.rs:343`、nested-spawn test |
| reservation、failed nickname、fork barrier | `registry.rs:79/216/308`、`spawn.rs:464`、registry test |
| manual / mid-turn compaction 的 initial-context 差异 | `compact.rs:123/334`、`session/turn.rs:346`、两个 compact integration tests |
| RolloutBudget feature spec | `features/src/lib.rs:1241` |

机械检查确认所有文件存在，所有 `#L<number>` 均位于目标文件范围内。语义落点与 [final-v2 源码复验](review-final-v2-code.md) 的 P2-02 建议一致。

## 四、75 项与 13 项回归

### 4.1 Checklist

| 类别 | 总数 | 通过 |
|---|---:|---:|
| 文件与版本安全 | 4 | 4 |
| 金字塔结构 | 6 | 6 |
| 名称与执行面 | 6 | 6 |
| 用户三项观察 | 5 | 5 |
| 源码事实 | 8 | 8 |
| 训练事实与推断 | 6 | 6 |
| 评测与数字 | 14 | 14 |
| 因果与消融 | 6 | 6 |
| 风险、安全与未知 | 6 | 6 |
| 视觉、来源与链接 | 7 | 7 |
| 写作与可读性 | 7 | 7 |
| **合计** | **75** | **75** |

final-v3 的增量没有触及 final-v2 已通过的评测、视觉和叙事内容；源码 P2 修订提高了“源码事实”和“链接”两类的精度。

### 4.2 No-Go

13 项全部继续通过：

1. Ultra 未写成独立模型或公开 effort。
2. root+3 未写成产品私有拓扑直接事实。
3. 点估计未写成统计显著。
4. bundle 增益未归因给单一机制。
5. 未给出 16-agent 精确数字。
6. MRCR/GraphWalks 未被当作 durability。
7. benchmark 未被用于推出状态落盘。
8. 历史训练未直接归因给 Sol。
9. 第一人称训练叙述未作 provenance。
10. 五条 token/预算路径保持分离。
11. Goal contract 与 runtime enforcement 保持分离。
12. 图内独有信息已经视觉复核并保留统计边界。
13. 历史稿与 final-v1/final-v2 未覆盖。

## 五、链接、视觉与历史完整性

- 76 个本地引用，68 个唯一目标，缺失 0。
- 所有带 `#L` 的源码链接行号均有效。
- final-v3 引用的三张视觉文件与 `visual-evidence-audit-v2.md` 继续存在；视觉章节与已通过的 final-v2 完全相同。
- final-v1 SHA-256：`1BDE3F19A2D32FF76C07E74880827CE74C71939BE83B443724BEC9161409A33B`。
- final-v2 SHA-256：`7122BD2D96CD0FB5D13142D5A1ED3C85F4765F5BD1E3D5C657A6234457B7436E`。
- v0–v3 草稿 hash 与前次验收记录一致。
- 风格扫描未发现第一人称、禁止的对照句式或待办占位符。

## 六、最终交付判断

final-v3 只对 final-v2 的两个源码 P2 进行修订，并更新版本声明。所有原有验收结论继续成立，新增修改也通过源码语义和链接检查。

**final-v3 是当前推荐交付版本。**

