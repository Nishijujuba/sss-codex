# final-v4 最终增量验收

> 验收对象：[`final-v4`](../final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)  
> 对照基线：[`final-v3`](../final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)  
> 验收合同：[75 项 checklist 与 13 项 No-Go](final-report-structure-and-acceptance.md)  
> 验收日期：2026-07-12（Asia/Shanghai）  
> final-v4 SHA-256：`8E55035B7FED017801BD60A87410E8AF1EE18495184A582708971F7F49079B11`  
> 操作边界：本轮只新增该验收记录，没有修改 final-v4、历史 final、草稿、视觉审计或图像资产。

## 一、结论

**final-v4 通过最终验收，可以交付，并应作为当前推荐版本。**

- P0：0
- P1：0
- P2：0
- Checklist：`75 / 75 PASS`
- No-Go：`13 / 13 PASS`
- final-v4 本地引用：`77` 个引用 / `69` 个唯一目标 / `0` 缺失 / `0` 越界行号
- 视觉审计 v3 本地引用：`10` 个引用 / `10` 个唯一目标 / `0` 缺失
- 历史版本：final-v1–final-v3 与 v0–v3 草稿全部存在，已记录 hash 未改变

[`源码回归快审`](review-final-v4-code-regression.md) 与 [`官方／视觉证据 Delta 复验`](review-final-v4-official-visual-delta.md) 均报告 P0=0、P1=0、P2=0。当前验收对两份并行复核、机械链接检查、历史文件完整性和验收合同进行了最终汇总。

## 二、final-v3 → final-v4 的实际增量

机械 diff 为 `7` 行新增、`7` 行删除。变化只落在以下范围：

1. 报告版本由 v3 更新为 v4，历史版本保留范围扩展到 final-v1–final-v3。
2. Figure 7 小节标题聚焦 severity-3 风险点估计及其与 persistence 的关联。
3. PDF 定位统一为“物理第 20 页（页脚编号 19）”。
4. persistence 关联明确标为图文联合 `I1`；Figure 7 对能力侧独立因果贡献的边界得到明示。
5. 当前视觉依据更新为 [`视觉证据审计 v3`](visual-evidence-audit-v3.md)。
6. Deployment Simulation 网页 Figure 1 与论文 Figure 2 的关系限定为“核心流程结构一致”，并明确编号、画风、节点文案与图注细节不同。

评测数字、八项选择偏差矩阵、Terminal 对照、16-agent 边界、训练分层、三项用户回答、Goal、五条 token／预算路径、源码导航、风险清单、消融方案和最终顶层结论均未发生内容变化。因此，[`final-v3 验收`](review-final-v3-acceptance.md) 与更早的 [`final-v2 全量验收`](review-final-v2-acceptance.md) 对这些区块的结论继续成立。

## 三、五项指定增量复核

| 指定项 | final-v4 状态 | 验收结论 |
|---|---|---|
| Figure 7 provenance 收紧 | 六类 severity-3 点估计保留为图像直接事实；persistence 关联标为图文联合 `I1`；能力侧独立因果贡献标为未建立 | PASS |
| 双重页码 | 正文与视觉审计均写明“物理第 20 页（页脚编号 19）” | PASS |
| 两张流程图的关系 | 只主张核心流程结构一致；编号、画风、节点文案与图注差异被明确列出 | PASS |
| 视觉审计 v3 | 正文链接有效；审计记录官方来源、归档传输、双重页码、图像 hash、直接视觉复核和未知边界 | PASS |
| 版本声明 | 页首与页尾均标记独立 final-v4，并声明保留 final-v1–final-v3、v0–v3 草稿和旧审计 | PASS |

Figure 7 的六组点估计没有变化。误差条类型、样本量与显著性继续标为未知；格式化 `0.00000` 没有被解释为真实概率严格等于零。该措辞与 [`视觉证据审计 v3`](visual-evidence-audit-v3.md) 的证据分层一致。

## 四、P0 / P1 / P2

### P0

未发现。

### P1

未发现。

### P2

未发现。

上一轮官方／视觉终审记录的 P1=1、P2=3 已全部关闭：Figure 7 证据范围、双重页码、两张 Deployment 图的一致性范围、网络故障实施主体推断均已修正。final-v3 已关闭的 usage-limit 状态穷举和四组源码 line-anchor P2 也没有回退。

## 五、75 项 checklist 回归

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

增量修改提高了“视觉、来源与链接”和“因果与消融”的精度。其余九类的正文逐字保持或只发生版本元数据更新，既有通过结论没有回退。风格扫描未发现第一人称、禁用对照句式或未完成标记。

## 六、13 项 No-Go 回归

1. Ultra 没有被写成独立模型或公开 effort。
2. root+3 没有被写成产品私有拓扑直接事实。
3. 点估计没有被写成统计显著。
4. bundle 增益没有被归因给单一机制。
5. 报告没有给出 16-agent 精确交互数字。
6. MRCR／GraphWalks 没有被用作 durability 直接证据。
7. benchmark 没有被用来推出 Goal、rollout 或预算状态落盘。
8. 历史训练方向没有被直接归因给 Sol。
9. 报告没有使用第一人称私有训练经历作为 provenance。
10. 五条 token／预算路径继续分离。
11. Goal prompt contract 与 runtime enforcement 继续分离。
12. 图内独有信息已有本地视觉复核，统计与因果边界保持明确。
13. final-v1–final-v3 与 v0–v3 草稿均未覆盖。

**结果：13 / 13 PASS。**

## 七、评测、来源与源码结论不变性

### 7.1 评测结论

final-v3 与 final-v4 的逐行 diff 没有触及评测章节。八项 benchmark 数字、Terminal-Bench 2.0 对照、选择偏差矩阵、Ultra 点估计的非显著性边界、MRCR／GraphWalks 的证据用途和 bundle 因果限制全部保持原文。因此，评测结论不变。

### 7.2 官方来源结论

官方事实没有新增或撤回。Figure 7 的数值保持不变，变化只收窄了该图可支持的因果范围。Deployment Simulation 的两张图仍支持同一核心评测流程，工件身份和表现细节已被分开说明。官方／视觉 Delta 复验据此确认 13 项 No-Go 全部通过。

### 7.3 源码结论

Goal、五条 token／预算路径、附录 A 与 A.1 在 final-v3 和 final-v4 中逐字一致。源码回归快审复核了 `32` 个源码 line anchors，目标缺失 `0`、越界 `0`。usage-limit 对 `Active`、`BudgetLimited` 和无 tracked goal 三种情况的表述继续有效。源码结论不变。

## 八、视觉、链接与历史版本完整性

### 8.1 视觉资产

视觉审计 v3 记录三张核心视觉均已执行 `view_image` 原图复核。当前文件 hash 与审计记录一致：

| 资产 | SHA-256 |
|---|---|
| `gpt-5-6-system-card-figure-7-internaldep-v3.png` | `39D7019855B4DC5636AA477FC7560410AB5B2C3522C0C242130064C4BBD7CAF1` |
| `deployment-simulation-figure-1-production-resampling.png` | `D39A53751AAE4732FBF1635C45FA8A49C5E10B2F3FD2FDF58DC2876CDFF8586F` |
| `deployment-simulation-paper-figure-2-pipeline-v3.png` | `DEFFA4FEC86F7F45282B386C1F44F21807A4390807DC3D5E974B90F6EC99234A` |

Figure 7 当前工件来自官方 System Card PDF 的归档原始响应，经物理第 20 页渲染及局部裁剪取得。该工件没有宣称与当前不可达的官方静态 `internaldep.png` 字节相同。原始 PNG byte hash 继续标为未知。

### 8.2 链接

- final-v4：77 个本地引用、69 个唯一目标、缺失 0、越界行号 0。
- 视觉审计 v3：10 个本地引用、10 个唯一目标、缺失 0。
- final-v4 引用的三张核心图像、当前及历史视觉审计、源码文件和历史报告均存在。

### 8.3 历史版本 hash

| 文件 | SHA-256 |
|---|---|
| `draft-v0-evidence-map.md` | `5908642ECC753AF691DD438DD8720C36F7F2700720F5C234821FF1DDEA65EA23` |
| `draft-v1-source-synthesis.md` | `0595A1E866E141B92B5AEEC74D021178ABCBF4DBD99C3A87397B6DC3154190AD` |
| `draft-v2-causal-architecture-and-evals.md` | `2B166E5C620C265E0C8AD88BC6AD852D545A551E44F8E1BCDECFBF411DC2AD76` |
| `draft-v3-reviewed-claim-ledger.md` | `FD56879DA275DAC75B091D919A1BCEA41E185F5B9D11233D1EEA3D8A4603A1FD` |
| `final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md` | `1BDE3F19A2D32FF76C07E74880827CE74C71939BE83B443724BEC9161409A33B` |
| `final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md` | `7122BD2D96CD0FB5D13142D5A1ED3C85F4765F5BD1E3D5C657A6234457B7436E` |
| `final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md` | `DDD4F92ACF514F7E31AB8A7774081EE1280163F4CC191884E75E95822320C61B` |
| `final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md` | `8E55035B7FED017801BD60A87410E8AF1EE18495184A582708971F7F49079B11` |

v0–v3 草稿与 final-v1–final-v3 的 hash 均与前次验收记录一致。

## 九、最终可交付判断

final-v4 已关闭 Figure 7 provenance、双重页码、两张流程图关系和视觉审计版本的全部剩余问题。评测、官方来源和源码结论没有回退；75 项 checklist 与 13 项 No-Go 全部通过；本地链接、历史文件和视觉资产完整。

**final-v4 达到最终可交付状态，并作为当前推荐版本。**
