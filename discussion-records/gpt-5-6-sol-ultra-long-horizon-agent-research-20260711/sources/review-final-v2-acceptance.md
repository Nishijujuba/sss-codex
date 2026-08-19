# final-v2 独立最终验收

> 验收对象：[final-v2](../final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)  
> 验收标准：[最终结构与验收清单](final-report-structure-and-acceptance.md) 的 75 项 checklist 与 13 项 No-Go  
> 验收日期：2026-07-12（Asia/Shanghai）  
> 源码基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`  
> final-v2 SHA-256：`7122BD2D96CD0FB5D13142D5A1ED3C85F4765F5BD1E3D5C657A6234457B7436E`  
> 操作边界：本验收没有修改 final-v2、final-v1、v0–v3 或旧 source。

## 一、结论

**final-v2 通过最终验收，可以交付。**

- P0：0
- P1：0
- P2：0
- 75 项 checklist：`75 / 75 通过`
- 13 项 No-Go：`13 / 13 通过`
- 本地链接：`71 个引用 / 63 个唯一目标 / 0 缺失 / 0 越界行号`
- 视觉：正文引用的三张图片均存在，当前验收已用 `view_image` 原图复核，文件 hash 与视觉审计 v2 一致
- 历史版本：final-v1 hash 保持 `1BDE3F19A2D32FF76C07E74880827CE74C71939BE83B443724BEC9161409A33B`，v0–v3 与 final-v1 均继续存在

final-v1 验收中的三项 P1 已全部闭环：视觉资产和审计文件补齐；Terminal-Bench 对照冲突进入正文；八项 benchmark 的有效性和选择偏差形成统一矩阵。两项 P2 也已闭环：16-agent 定性边界和关键数字的就近一手链接均已补齐。

## 二、P0 / P1 / P2

### P0

未发现。

### P1

未发现。

### P2

未发现。

报告仍保留的 `U` 均属于真实证据边界，包括私有 Ultra 拓扑与调度、组件级因果贡献、16-agent 精确坐标、Figure 7 官方静态 PNG 原始字节 hash、训练配方和 durability benchmark。这些未知项已被明确披露，未形成验收缺陷。

## 三、重点修订复核

### 3.1 Terminal-Bench `85.6` 与 `83.4 ± 2.2`

**通过。** final-v2 第 162、356、364 行完整保留：

- OpenAI 发布表 GPT-5.5 为 `85.6%`。
- 维护方排行榜 Codex CLI + GPT-5.5 为 `83.4% ± 2.2`，建议每题五次。
- 两处运行记录没有对齐，不能直接互换。
- 采样、Harness、模型 snapshot、任务 snapshot、环境配置和其他原因均保持未知。
- 维护方榜截至审计日没有 GPT-5.6 条目。

`GPT-5.5 → Sol +3.2pp` 只作为 OpenAI 发布表内部配置级差值使用，没有被写成维护榜可复算结果。[维护方排行榜](https://www.tbench.ai/leaderboard/terminal-bench/2.1)

### 3.2 八项评测的有效性与选择偏差矩阵

**通过。** final-v2 第 360–373 行覆盖：

1. Terminal-Bench 2.1
2. DeepSWE
3. Agents’ Last Exam
4. GeneBench-Pro
5. BrowseComp
6. SEC-Bench Pro
7. MRCR v2
8. GraphWalks BFS

每行均给出实际测量对象、时间/步数、坏题或版本边界、最大选择偏差和 Ultra 状态。final-v1 缺失的 DeepSWE OSS 筛选、ALE 私有池/living snapshot、GeneBench 合成因果世界和 82/129 外部审查、MRCR 每 bin 100 样本与 bug 修复、GraphWalks BFS/F1 边界均已补齐。矩阵明确禁止把不同评分制横向解释为统一成功率。

### 3.3 16-agent 定性边界

**通过。** final-v2 第 164 行准确拆分：

- `F1`：BrowseComp 与 SEC-Bench Pro 交互图包含 16-agent 配置，官方定性描述分数—延迟前沿改善。
- `U`：本轮没有建立精确坐标、hover 值、误差表示和 4→16 边际收益。
- `I1`：三项 Ultra 任务允许并行工作分解，可能更适合展示宽度扩展；官方没有披露选报规则。

报告没有给出 16-agent 精确分数、延迟、token、成本或边际收益。

### 3.4 就近一手链接

**通过。** 关键数字均有邻近来源：

- Ultra 三项表：第 160 行链接 GPT-5.6 发布页。
- Terminal-Bench 对照：第 162、356 行链接维护榜、发布说明和数据页。
- BrowseComp / SEC-Bench Pro：第 352–354 行链接官方介绍、论文、System Card 和维护站。
- DeepSWE / ALE / GeneBench / 内部评测 / cyber range：第 377–385 行逐项链接论文、榜单或 System Card。
- MRCR / GraphWalks：第 396 行链接发布页和两个数据卡。
- METR 与 SWE-Bench Pro：第 400–402 行链接 System Card 和官方审计。

外部 URL 共 74 个，来源域均为 OpenAI/OpenAI CDN、评测维护方、原始论文或原始数据卡，没有搜索结果页或二手新闻源。

### 3.5 本地链接

**通过。** 机械检查结果：

- 71 个相对链接或图片引用。
- 63 个唯一目标。
- 文件缺失数为 0。
- `#L<number>` 行号超过目标文件长度的数量为 0。
- final-v2 附录新增的实现—测试链接全部解析到当前源码。
- [视觉复核 v2](visual-evidence-audit-v2.md) 内的十个本地链接也全部存在。

### 3.6 视觉交付

**通过。** 当前验收直接查看了：

1. [`gpt-5-6-system-card-figure-7-internaldep-v3.png`](../assets/gpt-5-6-system-card-figure-7-internaldep-v3.png)
2. [`deployment-simulation-figure-1-production-resampling.png`](../assets/deployment-simulation-figure-1-production-resampling.png)
3. [`deployment-simulation-paper-figure-2-pipeline-v3.png`](../assets/deployment-simulation-paper-figure-2-pipeline-v3.png)

视觉结果与 final-v2 第 414–424 行一致：

- Figure 7 的六组标签、点估计、颜色、误差条和图题可读。
- 六类 Sol 点估计均高于 GPT-5.5；`0.00000` 只被解释为格式化标签。
- 报告明确说明误差条类型、样本量和显著性未知。
- Deployment Simulation 网页图的主链、审计支路和 `same measurement stack` 可读。
- 论文 Figure 2 的完整图注明确发布后复测与预测验证。

文件 hash 与 [视觉复核 v2](visual-evidence-audit-v2.md) 一致：

| 文件 | SHA-256 |
|---|---|
| Figure 7 v3 | `39D7019855B4DC5636AA477FC7560410AB5B2C3522C0C242130064C4BBD7CAF1` |
| Deployment 网页 PNG | `D39A53751AAE4732FBF1635C45FA8A49C5E10B2F3FD2FDF58DC2876CDFF8586F` |
| Deployment 论文 Figure 2 v3 | `DEFFA4FEC86F7F45282B386C1F44F21807A4390807DC3D5E974B90F6EC99234A` |

Figure 7 的官方静态 PNG 原始 byte hash 尚未取得；报告明确说明当前图片来自官方 PDF 的归档原始响应和本地裁剪。这是已披露 provenance 边界，不影响视觉内容验收。

### 3.7 历史版本不覆盖

**通过。** final-v2 是独立文件，final-v1 与 v0–v3 均存在。final-v1 的 SHA-256 与前次验收记录完全一致：

`1BDE3F19A2D32FF76C07E74880827CE74C71939BE83B443724BEC9161409A33B`

final-v2 第 8、618 行也明确声明没有覆盖历史版本。

## 四、用户三项观察

### 4.1 子 Agent 规划

**通过。** 第 16–20 行在首个技术图之前直接回答，覆盖模型分解、主动委派、typed collaboration、独立上下文、有界并发、root synthesis、四 Agent 事实、root+3 的 `I1/U` 边界和 Ultra bundle 混杂。

### 4.2 任务状态落盘

**通过。** 第 22–26、189–251 行区分 Artifact、rollout、三类 compaction、WorldState/TurnContext、Goal SQLite、thread/Agent graph、PlanUpdate、mailbox、ProcessStore 和内存预算状态。PlanUpdate 继续标为 transient，详细进展仍依赖 response/rollout/Artifact。

### 4.3 token 限额附近落盘

**通过。** 第 28–32、253–263 行完整列出五条路径。final-v2 进一步修正：

- Goal steering 只在 qualifying tool-finish crossing 首次注入；turn stop/abort crossing 只持久化终态。
- steering 是模型契约，同一 turn 工具没有 hard disable。
- RolloutBudget 是 UnderDevelopment、默认关闭；counter 和 reminder delivery watermark 未见 hydrate。
- 没有任何 token 触顶自动写 Markdown 的通用规则。

## 五、75 项 checklist

| 类别 | 总数 | 通过 | 部分通过 | 未通过 |
|---|---:|---:|---:|---:|
| 文件与版本安全 | 4 | 4 | 0 | 0 |
| 金字塔结构 | 6 | 6 | 0 | 0 |
| 名称与执行面 | 6 | 6 | 0 | 0 |
| 用户三项观察 | 5 | 5 | 0 | 0 |
| 源码事实 | 8 | 8 | 0 | 0 |
| 训练事实与推断 | 6 | 6 | 0 | 0 |
| 评测与数字 | 14 | 14 | 0 | 0 |
| 因果与消融 | 6 | 6 | 0 | 0 |
| 风险、安全与未知 | 6 | 6 | 0 | 0 |
| 视觉、来源与链接 | 7 | 7 | 0 | 0 |
| 写作与可读性 | 7 | 7 | 0 | 0 |
| **合计** | **75** | **75** | **0** | **0** |

结构方面，报告仍使用 17 个主章节，超过结构稿的九章建议。该分章保持结论先行和单向论证：执行摘要先回答三项观察，正文按术语、机制、状态、训练、评测、风险、实验推进，结尾回收原问题。它没有形成验收失败或新的重复主张。

## 六、13 项 No-Go

| No-Go | 结果 | 证据 |
|---:|---|---|
| 1. Ultra 写成独立模型或公开 effort | PASS | 第 57–69 行 |
| 2. root+3 写成产品私有拓扑事实 | PASS | 第 18 行保持 `I1/U` |
| 3. 点估计写成统计显著 | PASS | 第 160、414 行保留统计未知 |
| 4. bundle 增益归因给单一机制 | PASS | 第 12、20、160、523 行 |
| 5. 给出未建立的 16-agent 精确数字 | PASS | 第 164、618 行 |
| 6. MRCR/GraphWalks 当作 durability | PASS | 第 73–86、387–406 行 |
| 7. benchmark 推出状态落盘 | PASS | 状态证据来自当前源码 |
| 8. 历史训练直接归因给 Sol | PASS | 第 311–321 行 |
| 9. 第一人称训练回忆作证据 | PASS | 第 346、446 行 |
| 10. 五条 token/预算路径混用 | PASS | 第 253–263 行 |
| 11. Goal contract 与 runtime enforcement 混用 | PASS | 第 226–239 行 |
| 12. 使用未视觉复核的图内独有信息 | PASS | 三图已复核，边界见第 414–424 行 |
| 13. 覆盖历史草稿 | PASS | final-v2 独立，final-v1 hash 未变 |

## 七、最终交付判断

final-v2 已满足结构、事实、评测、因果、来源、视觉和版本安全要求。报告可以作为本轮研究的最终 Markdown 交付。

交付时仍应保留这些明确未知：16-agent 精确图值、Figure 7 官方静态 PNG 原始 byte hash、私有 Ultra scheduler、完整训练配方和 durability 组件消融。它们已经在 final-v2 中正确标注，不需要阻止交付。

