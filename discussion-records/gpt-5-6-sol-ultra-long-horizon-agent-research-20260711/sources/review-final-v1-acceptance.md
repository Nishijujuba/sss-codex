# final-v1 独立最终验收

> 验收对象：`../final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md`  
> 验收标准：`final-report-structure-and-acceptance.md` 的 75 项 checklist 与 13 项 No-Go  
> 验收日期：2026-07-12（Asia/Shanghai）  
> 源码基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`  
> 被验收文件 SHA-256：`1BDE3F19A2D32FF76C07E74880827CE74C71939BE83B443724BEC9161409A33B`  
> 操作边界：本验收没有修改 final-v1、v0–v3 或旧 source。

## 一、验收结论

**当前结论：final-v1 暂不可直接交付；完成三项 P1 修订并满足视觉交付前条件后可重新验收。**

- P0：0
- P1：3
- P2：3
- 75 项 checklist：`71 通过 / 2 部分通过 / 2 未通过`
- 13 项 No-Go：`13 项均未发现内容性触发`
- 视觉交付状态：`阻塞`；两张嵌入图片与 `visual-evidence-audit-v2.md` 均不存在

该结论具有明确边界：核心事实、用户三项观察、五条预算路径、训练分层、Ultra bundle 因果限制和主要分数均准确。当前阻塞来自交付完整性和评测有效性信息缺口，没有发现需要推翻顶层结论的错误。

## 二、P0

未发现 P0。

以下 13 类高风险错误均未出现：Ultra 被写成独立模型或公开 effort、root+3 被写成产品私有事实、点估计被写成统计显著、bundle 增益被分给单一机制、虚构 16-agent 数字、MRCR/GraphWalks 被当作 durability、benchmark 被用于推出状态落盘、历史训练被直接归因给 Sol、第一人称训练回忆被当作证据、五条预算路径混用、Goal contract/runtime 混用、引用未复核图中独有数字、覆盖历史草稿。

## 三、P1 findings

### P1-1：视觉资产和视觉复核 v2 缺失，当前 Markdown 含三个断链目标

**位置**：final-v1 第 393、395、399、579 行。

**证据**：

- `assets/gpt-5-6-system-card-figure-7-internaldep.png` 不存在。
- `assets/deployment-simulation-figure-1-production-resampling.png` 不存在。
- `sources/visual-evidence-audit-v2.md` 不存在。
- `assets/` 当前没有文件。
- 对 final-v1 的本地链接扫描得到 42 个引用，三个目标缺失；其他本地源码和 source 链接均存在。

**影响**：

- 两个图片位置无法渲染。
- 第 395、579 行把一个不存在的 v2 复核文件写成视觉结论依据。
- 正文当前只使用官方相邻文字和方法描述，没有使用缺失图片中的独有坐标、柱高、误差线或绝对发生率。因此 No-Go 12 尚未形成内容性触发。

**交付前修订**：后续新版本只能采用以下一种完整方案：

1. 补齐两张原始图片，使用 `view_image` 完成实际检查，新增 `visual-evidence-audit-v2.md`，记录来源 URL、文件 hash、像素尺寸、图例、轴、可读范围和限制；随后验证三个相对链接。
2. 移除两个图片 embed 和全部 v2 复核链接，保留文字结论并直接引用官方页面与现有 `visual-evidence-audit.md` 的“未视觉复核”边界。

final-v1 本身保持历史版本，不应原地覆盖。

### P1-2：Terminal-Bench 2.1 的 GPT-5.5 对照冲突遗漏

**位置**：final-v1 第 154–160、352 行。

**现状**：报告准确列出 OpenAI 发布页的 GPT-5.5 `85.6%`，并保留 Terminal-Bench `28 / 26` 修复计数差异。它没有记录维护方 2.1 排行榜的 Codex CLI + GPT-5.5 `83.4% ± 2.2`。

**证据**：[Terminal-Bench 2.1 维护方排行榜](https://www.tbench.ai/leaderboard/terminal-bench/2.1) 当前列 `83.4% ± 2.2`，运行示例使用 `-k 5`；[OpenAI 发布页](https://openai.com/index/gpt-5-6/) 列 `85.6%`。`85.6` 位于维护方区间上界。维护方榜当前没有 GPT-5.6 条目。

**影响**：表中 `GPT-5.5 → Sol +3.2pp` 是 OpenAI 发布表内部的正确算术差值；缺少维护方对照会让读者忽略该 benchmark 对重复采样、harness、快照和环境配置的敏感性。两处数值的差异无法证明 harness 已改变，也无法证明只有采样波动。

**建议修订**：在 Terminal-Bench 段落加入：

> OpenAI 发布页的 GPT-5.5 为 `85.6%`，维护方榜为 `83.4% ± 2.2`。两处运行记录未公开对齐，不能直接互换；差异可能来自采样、harness、模型 snapshot、任务 snapshot 或其他配置，当前原因未知。维护方榜尚无 GPT-5.6 条目。

### P1-3：八项 benchmark 的有效性与选择偏差覆盖不完整

**位置**：final-v1 第 346–377 行。

**准确部分**：BrowseComp、SEC-bench Pro、Terminal-Bench 的选择偏差较完整；DeepSWE、ALE、GeneBench、MRCR、GraphWalks 的任务与关键数字也准确。

**缺口**：

- DeepSWE 未写热门、活跃、至少 500 stars、宽松许可证 OSS 的选择条件，也未写 binary functional correctness 和单一 mini-swe-agent harness 限制。
- ALE 未写约 90% 私有池、living benchmark、数字化可验证工作筛选和 task snapshot 演化。
- GeneBench-Pro 未写 129 项合成已知因果结构、82/129 外部专家审查，以及真实未知机制覆盖有限。
- MRCR 未写每 bin 100 样本与约 10% needle / 5% ground-truth 修复幅度。
- GraphWalks 已写长度单位和数据修复，未指出发布只报告 BFS、F1 可给部分正确集合分数，与 pass/fail 不可等价。

**影响**：最终报告已经拒绝把这些 benchmark 当作 durability 证据，主结论仍成立。选择偏差覆盖不对称会让 DeepSWE、ALE 和 GeneBench 看起来比 BrowseComp、SEC-bench 更接近无条件真实世界测量。

**建议修订**：采用验收大纲要求的八行有效性表，每行固定五列：真正测到的能力、时间/步数、坏题/版本、最大选择偏差、Ultra 状态。详细证据链接到 [benchmark 独立审计](benchmark-and-eval-audit.md)。

## 四、P2 findings

### P2-1：16-agent 的公开定性证据被遗漏

**位置**：final-v1 第 152–162、325、444–450 行。

报告没有编造 16-agent 精确数字，No-Go 5 通过。它只在训练假设和复现实验中写 `1/4/16`，没有说明官方发布页正文已确认 BrowseComp 与 SEC-bench Pro 图包含 16-agent 配置。

后续版本应补充：

> `F1` 发布页正文说明 BrowseComp 与 SEC-bench Pro 图包含 16-agent 配置。`U` 当前本地视觉审计尚未建立图中精确坐标、hover 值、误差表示或 4→16 边际收益；相关数值不得填补。

这项补充同时避免使用“官方没有公开图中数值”的绝对措辞；当前证据只能说明本轮未建立精确值。

### P2-2：部分关键评测数字缺少就近一手链接

**位置**：final-v1 第 358–377、366 行。

Ultra 三项表在第 160 行有直接发布页链接，处理合格。DeepSWE、ALE、GeneBench、32-step cyber range、MRCR 与 GraphWalks 的数字主要依赖附录来源或 source dossier，数字旁没有直接一手链接。

后续版本应在长上下文表后直接链接 GPT-5.6 发布页与 MRCR/GraphWalks 数据卡；在 DeepSWE、ALE、GeneBench 和 cyber range bullet 后分别链接原始榜单、论文或 System Card。该修订提高可追溯性，不改变数字本身。

### P2-3：一处选择理由重复时丢失 `I1` 标签

**位置**：final-v1 第 162、354 行。

第 162 行正确把“三项任务可能更适合展示宽度扩展”标为 `I1`，并注明官方未披露选报规则。第 354 行再次写“三项都适合并行分支”时没有保留 `I1`。后续版本应写成“`I1` 三项都允许并行分支”，避免把任务选择理由误读为官方说明。

## 五、准确项与结构验收

### 5.1 用户三项观察

三项直接回答均通过，且位于首个技术图之前：

1. **子 Agent 规划**（第 16–20 行）：模型、proactive 授权、typed tools、独立上下文、有界并发、root synthesis 和 bundle 混杂全部出现；产品 root+3 保持 `U`。
2. **任务状态落盘**（第 22–26 行；第 187–247 行）：Artifact、rollout、compaction、WorldState/TurnContext、Goal SQLite、thread/Agent graph、PlanUpdate 和内存运行态职责分开。
3. **token 限额落盘**（第 28–32 行；第 249–259 行）：五条路径完整，Goal steering 与 runtime 强制边界准确，没有声称通用自动 Markdown。

### 5.2 评测数字与因果

- BrowseComp `84.4 → 90.4 → 92.2`，差值 `+6.0 / +1.8pp`：准确。
- SEC-bench Pro `45.8 → 71.2 → 74.3`，差值 `+25.4 / +3.1pp`：准确。
- Terminal-Bench `85.6 → 88.8 → 91.9`，差值 `+3.2 / +3.1pp`：作为 OpenAI 发布表内部比较准确。
- Ultra 三项均写“点估计 / bundle / 无完整 CI 与配对检验”：准确。
- ALE、DeepSWE、GeneBench、OSWorld、MRCR、GraphWalks 无 Ultra 数字：准确。
- MRCR 两档和 GraphWalks 两档数字、similarity / set-F1 区分、GraphWalks 单位未知：准确。
- ALE `53.6 / 52.7` 和 Terminal 修复项 `28 / 26` 冲突：准确。
- METR 不能支持固定自主小时数：准确。
- benchmark 不证明 durability：准确且明确。

### 5.3 训练与 Harness

- 训练严格分为 GPT-5.6 直接事实、OpenAI 历史方向、I2 假设和 U 未知。
- persistence training 直接披露与其用户体验贡献推断分开。
- codex-1、o3/o4-mini、Deep Research、process supervision 没有直接归因给 Sol。
- 第一人称训练叙述明确排除为 provenance。
- rollout ordinal、三种 compaction、Goal objective 注入、completion/blocker contract、PlanUpdate transient、Code Mode session 内存等 v3 校正全部吸收。
- 五组消融、1/4/16、等 token/wall-clock/成本、power analysis 和故障注入任务覆盖完整。

### 5.4 金字塔结构

- 顶层结论位于第 12 行。
- 三项用户观察紧随结论。
- 主体按名称 → 长上下文边界 → 系统栈 → 模型 → Ultra → 状态 → token 路径 → Harness → 训练 → 评测 → 风险 → 实验展开。
- 最终结论重新汇总三项观察，没有引入新主张。
- 全文采用中文无主句/第三人称，没有发现禁止的对照句式、待办占位符或内部执行推理。

最终稿使用 17 个主章节，高于结构稿建议的九章。当前分章仍保持单向论证，未造成结论顺序错误；该项不列 finding。若后续版本需要降低认知负担，可将“长上下文、模型、Ultra、状态、Harness”合并为结构稿中的三个机制章节。

## 六、75 项 checklist 计分

| 类别 | 总数 | 通过 | 部分通过 | 未通过 | 主要证据或例外 |
|---|---:|---:|---:|---:|---|
| 文件与版本安全 | 4 | 4 | 0 | 0 | 独立 final-v1、日期与 commit 完整 |
| 金字塔结构 | 6 | 6 | 0 | 0 | 第 10–32 行结论与三答优先 |
| 名称与执行面 | 6 | 6 | 0 | 0 | 第 57–71 行分层准确 |
| 用户三项观察 | 5 | 5 | 0 | 0 | 第 16–32、187–259 行 |
| 源码事实 | 8 | 8 | 0 | 0 | v3 两轮复核校正已吸收 |
| 训练事实与推断 | 6 | 6 | 0 | 0 | 第 293–342 行四层结构 |
| 评测与数字 | 14 | 12 | 1 | 1 | benchmark 选择偏差部分覆盖；缺 Terminal 维护榜对照 |
| 因果与消融 | 6 | 6 | 0 | 0 | bundle 限制与五组实验完整 |
| 风险、安全与未知 | 6 | 6 | 0 | 0 | 第 403–421 行 |
| 视觉、来源与链接 | 7 | 5 | 1 | 1 | 关键数字就近引用部分覆盖；三个本地目标缺失 |
| 写作与可读性 | 7 | 7 | 0 | 0 | 风格扫描无命中，结尾回收主张 |
| **合计** | **75** | **71** | **2** | **2** |  |

未通过项：

1. Terminal `85.6` 与维护榜 `83.4 ± 2.2` 的差异原因未保留为未知。
2. 所有相对链接可解析：两个图片和视觉复核 v2 缺失。

部分通过项：

1. 每个 benchmark 的任务、时间、snapshot、污染和选择偏差均有充分说明。
2. 每个关键数字旁均有一手来源链接。

## 七、13 项 No-Go 核对

| No-Go | 结果 | 证据 |
|---:|---|---|
| 1. Ultra 写成独立模型或公开 effort | 通过 | 第 59–69 行 |
| 2. root+3 写成产品直接事实 | 通过 | 第 18 行保持 `I1/U` |
| 3. 点估计写成统计显著 | 通过 | 第 160 行明确未知 |
| 4. bundle 归因给单一机制 | 通过 | 第 20、160 行 |
| 5. 编造 16-agent 精确数字 | 通过 | 无精确数字 |
| 6. MRCR/GraphWalks 当作 durability | 通过 | 第 73–86、368–387 行 |
| 7. benchmark 推出状态落盘 | 通过 | 状态证据来自源码 |
| 8. 历史训练直接归因给 Sol | 通过 | 第 307–317 行 |
| 9. 第一人称训练回忆作证据 | 通过 | 第 342、423–427 行 |
| 10. 五条 token/预算路径混用 | 通过 | 第 249–259 行 |
| 11. Goal contract/runtime 混用 | 通过 | 第 224–235 行 |
| 12. 使用未视觉复核的图内独有信息 | 通过，带交付条件 | 只用相邻正文；图片文件缺失 |
| 13. 覆盖历史草稿 | 通过 | final-v1 独立文件 |

No-Go 全部通过并不自动构成交付通过。75 项 checklist 中仍有两个未通过项，且视觉资产是用户指定的交付前条件。

## 八、重新验收的最小条件

后续新版本满足以下条件后即可重新提交最终验收：

1. 补齐并实际复核两张图片及 `visual-evidence-audit-v2.md`，或移除缺失视觉及其 v2 链接并维持文本证据边界。
2. 加入 Terminal-Bench `85.6` 与维护榜 `83.4 ± 2.2` 的不可直接互换说明。
3. 用八行有效性表补齐 DeepSWE、ALE、GeneBench、MRCR 和 GraphWalks 的选择偏差。
4. 补充 16-agent 的官方定性存在与本轮精确值未知。
5. 给 DeepSWE、ALE、GeneBench、cyber range、MRCR 和 GraphWalks 的关键数字添加就近一手链接。
6. 重新运行本地链接检查，缺失目标必须为零。
7. 重新核对 final 文件 hash，并确认 v0–v3 未修改。

完成以上条件后，预期无需改变顶层结论、三项用户回答或五条预算路径。
