# v2 评测、数字、因果与消融独立审查

> 审查对象：`draft-v2-causal-architecture-and-evals.md`  
> 审查日期：2026-07-12（Asia/Shanghai）  
> 审查范围：单 agent / Ultra 数字、MRCR、GraphWalks、ALE、Terminal-Bench、durability 外推、选择偏差与消融设计  
> 操作边界：本审查未修改 v2 草稿；所有建议留给后续新版本吸收。

## 结论先行

v2 的分数抄录和算术差值整体准确，也明确拒绝用三项 Ultra 分数证明 checkpoint、resume、Goal SQLite 或 token-budget 中断恢复。这是正确且重要的证据边界。

当前没有 P0 级数字错误。主要缺口集中在六项 P1：

1. “单 agent 系统更替贡献多数分差”仍带有因果色彩；公开表格没有统一披露 reasoning effort、harness、预算和重复次数。
2. “并行探索与综合的净收益”把 Ultra 产品 bundle 的相关分差提前归因给具体机制；额外总计算、worker prompt、独立采样与 root synthesis 尚未分离。
3. Ultra 只在三项适合宽度扩展的评测上报告，v2 尚未完整列出未报告 Ultra 的任务以及三项已报告任务各自的选择偏差。
4. Terminal-Bench 的 `85.6%` 与 `83.4% ± 2.2` 只证明两处公开结果无法直接互换；`85.6` 正好位于维护方区间上界，差异本身不能证明 harness 或快照发生变化。
5. MRCR 与 GraphWalks 的数字准确，指标和长度口径仍需显式标注；GraphWalks 数据集公开字段是 `prompt_chars`，发布表中的 `256k` / `1mil` 没有披露字符或 token 口径。
6. 当前“控制变量矩阵”没有定义完整交叉实验，且 agent 数只写 `1 / 4`。它仍不足以分离模型、reasoning、agent 数、总计算和产品 Ultra bundle。

## 严重度标准

- **P0**：会颠倒核心结论、伪造关键数字或把不存在的公开证据写成已确认事实。
- **P1**：会造成重要因果误读、跨评测错误比较或显著高估公开证据覆盖面。
- **P2**：不改变主结论，仍会降低复现性、统计解释或术语精度。

## 一、Findings

### P0

未发现 P0。

### P1-1：单 agent 分差被写成“贡献”，控制变量并未固定

**位置**：v2 第 13、17、223–229、267–270 行。

**问题**：

- 第 17 行称“单 Agent 系统更替贡献了多数已报告分差”。公开数字只能表明，在三项同时给出 GPT-5.5、Sol 单 agent、Ultra 四 agent 的评测中，`GPT-5.5 → Sol` 的百分点差值分别为 `6.0`、`25.4`、`3.2`，`Sol → Ultra` 分别为 `1.8`、`3.1`、`3.1`。
- “贡献”意味着已经做过因果分解。发布页没有统一披露三项 baseline 的 reasoning effort、harness commit、提示、任务快照、总 token、wall-clock 和重复次数。
- DeepSWE 已明确出现 Sol `max` 与 GPT-5.5 `xhigh` 的 effort 混杂，说明“模型更替分差”不能自动等同于纯权重或后训练收益。[DeepSWE 论文与榜单](https://arxiv.org/html/2607.07946v1)
- 不同 benchmark 的百分点不能加总成统一“贡献率”；每项任务量、评分函数和方差都不同。

**建议修订**：把“贡献”统一改为“发布表系统分差”或“观察到的配置间分差”。建议替换第 17 行：

> OpenAI 发布表中，三项同时报告单 agent 与 Ultra 的评测均显示 `GPT-5.5 → Sol 单 agent` 的绝对百分点差值大于 `Sol 单 agent → Ultra 四 agent`，其中 Terminal-Bench 仅相差 `0.1 pp`。这些对比没有统一披露 reasoning effort、harness 和计算预算，因而只能视为配置级系统分差，不能分配给模型权重、后训练或运行时计算。

### P1-2：Ultra bundle 的分差被归因给“并行探索与综合”

**位置**：v2 第 14、17、58、229、269–270 行。

**问题**：

- 官方发布页确认 Ultra 默认协调四个 agent，并确认四 agent 的输出 token 和成本汇总所有 agent；延迟按 root agent 推导。[GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)
- `1 agent → Ultra 4 agents` 同时可能改变总采样计算、并发、子 agent 提示、上下文隔离、root synthesis、重试机会和停止策略。
- 当前公开消融没有分别关闭上述机制。第 58 行“支持并行探索与综合的净收益”越过了证据边界。
- 官方“分数—延迟前沿向左上移动”使用离线模拟延迟；它不能推出总计算量或真实部署成本下降。

**建议修订**：第 58 行采用 bundle 级措辞：

> 这些结果支持 Ultra 四 agent 系统在三项选定评测上的配置级净收益。公开材料没有分离并发本身、额外总采样、worker prompt、独立上下文、root synthesis 与重试机会的各自贡献。

第 229 行已经列出部分未知项，建议把该限定前移到首次出现 Ultra 数字的位置。

### P1-3：Ultra 结果存在选报边界，v2 的选择偏差清单不完整

**位置**：v2 第 17、58、231–233、345–347 行。

**问题**：

- 发布页只为 BrowseComp、SEC-bench Pro、Terminal-Bench 2.1 报告 Ultra 分数；Agents' Last Exam、DeepSWE、GeneBench-Pro、OSWorld 2.0、MRCR 与 GraphWalks 均没有 Ultra 结果。
- 这六项缺失结果使公开材料无法判断 Ultra 在强顺序依赖、共享写入、专业 GUI 工件、科学分析和单次超长输入任务上的收益是否为正。
- 三项已报告任务还带有不同选择偏差：
  - BrowseComp 是公开静态、逆向构题、短答案检索集；原始工作披露过 BrowseComp-like 专项训练，人工验证 reference agreement 为 `86.4%`，当前 `90%+` 分数接近饱和。[BrowseComp](https://openai.com/index/browsecomp/)、[BrowseComp 论文](https://arxiv.org/abs/2504.12516)
  - SEC-bench Pro 使用历史公开漏洞、给定相关源码路径和宽泛漏洞类别；OpenAI 使用 183-instance 旧快照，当前维护站已扩展到 344 项；结果还依赖三镜像验证、LLM judge 和降低 safeguards 的评测条件。[SEC-bench Pro 论文](https://arxiv.org/abs/2605.26548)、[SEC-bench Pro](https://sec-bench.github.io/)
  - Terminal-Bench 2.1 只有 89 项，且 26/28 项修改统计存在未解释差异；OpenAI 没有公开 5.6 原始轨迹、重复次数和置信区间。[Terminal-Bench 2.1 发布说明](https://www.tbench.ai/news/terminal-bench-2-1)

**建议修订**：在 7.2 后新增“7.3 Ultra 选报与任务分布”，完整列出六项未报告评测和上述三类偏差。结论应限定为“在三个被选择、且适配并行宽度的评测上观察到正分差”。“适配并行宽度”应标为任务结构推断。

### P1-4：Terminal-Bench 数字差异不足以证明 harness 或快照改变

**位置**：v2 第 249–250 行。

**准确部分**：

- OpenAI 发布页列 GPT-5.5 `85.6%`。
- 维护方 2.1 排行榜列 Codex CLI + GPT-5.5 `83.4% ± 2.2`，并给出 `-k 5` 运行示例。[维护方排行榜](https://www.tbench.ai/leaderboard/terminal-bench/2.1)
- 当前维护方榜没有 GPT-5.6 条目。

**问题**：`85.6` 正好等于维护方点估计加 `2.2`。如果 `±2.2` 是该页面展示的区间半宽，OpenAI 数字仍位于该区间边界。没有 seed 和原始运行时，重复采样本身已经足以解释差异。第 250 行“说明 Harness、快照或试验配置不一致”过强。

**建议修订**：

> OpenAI 发布页的 GPT-5.5 为 `85.6%`，维护方榜为 `83.4% ± 2.2`。两处结果来源和运行记录没有公开对齐，不能直接互换；现有材料无法判断差异来自采样波动、harness、模型快照、任务快照或其他配置。

### P1-5：MRCR 与 GraphWalks 的分数正确，指标及长度单位仍易被误读

**位置**：v2 第 13、235–244、251–252 行。

**准确部分**：

- MRCR `256K–512K`：Sol `91.5`，GPT-5.5 `81.5`，差值 `+10.0 pp`。
- MRCR `512K–1M`：Sol `73.8`，GPT-5.5 `74.0`，差值 `-0.2 pp`。
- GraphWalks BFS `256k`：Sol `90.7`，GPT-5.5 `73.7`，差值 `+17.0 pp`。
- GraphWalks BFS `1mil`：Sol `77.1`，GPT-5.5 `45.4`，差值 `+31.7 pp`。
- 第 244 行拒绝把两者当作 agent durability 证据，判断准确。[GPT-5.6 发布表](https://openai.com/index/gpt-5-6/)

**问题**：

- MRCR 分数是带 hash 检查的 `SequenceMatcher` 相似度；GraphWalks 分数是集合 precision/recall 的 F1。两类百分数不能与 pass rate 横向等价。
- GraphWalks 数据卡公开长度字段为 `prompt_chars`。OpenAI 发布表写 `256k` 和 `1mil`，没有披露这些标签的字符/token 口径或具体采样子集。[GraphWalks 数据卡](https://huggingface.co/datasets/openai/graphwalks)
- MRCR 每个长度 bin 只有 100 个样本，`-0.2 pp` 没有置信区间，不能解释为已确认退步；它只能证明“未观察到可确认提升”。[MRCR 数据卡](https://huggingface.co/datasets/openai/mrcr)
- 两个发布结果都没有绑定数据 commit。MRCR 在 2025-12-05 修复约 10% needle 数量和约 5% ground truth；GraphWalks 在 2026-02-27 修复 BFS 歧义与 24/400 parent ground truth。
- 第 13 行“长上下文检索提高”应同时提示 MRCR 最高档没有提高，避免只保留正向结果。

**建议修订**：

- 把表头改为“发布表长度标签”，行名保留原始 `256k` / `1mil`，脚注写明 GraphWalks 公开 schema 是字符数，发布表单位未知。
- 在评测名称后标注 `MRCR similarity` 与 `GraphWalks set-F1`。
- 把 `-0.2 pp` 描述为“点估计近似持平，统计差异未知”。

### P1-6：当前消融矩阵没有定义可识别的交叉实验

**位置**：v2 第 261–306 行。

**问题**：

- 表格把“模型、reasoning、agent 数、总 token”列为独立轴，却没有规定这些轴是否完整交叉。
- `agent 数` 只写 `1 / 4`，与前文重点讨论的 16-agent scaling 不一致。
- 产品 Ultra 与单 agent 的比较属于 bundle 对比。若目标是识别 agent 数的因果效应，需要同一模型、同一 root harness、同一 worker prompt、同一 synthesis、同一任务快照，只改变最大并发与 worker 数。
- “相同总 token”必须与 agent 数交叉执行；另需相同每-agent token、相同 wall-clock、相同美元成本三种预算口径。单独把它列成一行无法保证执行时控制成立。
- GPT-5.5 与 Sol 的 effort 名称未必代表同等实际计算。模型效应至少需要同 harness、同工具、同 aggregate token 和同 wall-clock 的 matched-budget 组，并把无法匹配的模型特性写为残余混杂。
- “每任务至少五个 seed”不是统计功效保证。Terminal-Bench 只有 89 项，Ultra 差值为 `3.1 pp`；应依据任务级方差和目标最小效应量做 power analysis。

**建议修订**：至少明确以下五组，并对每组采用配对任务级比较：

1. GPT-5.5，单 agent，固定 harness、工具、task snapshot、aggregate token 与 wall-clock。
2. GPT-5.6 Sol，单 agent，与第 1 组尽量匹配预算，估计模型系统更替分差。
3. GPT-5.6 Sol，单 agent `max`，放宽单 agent 计算，估计 test-time compute 分差。
4. GPT-5.6 Sol，同一实验 harness 下 `1 / 4 / 16 agents`，分别运行等 aggregate token、等 wall-clock、等成本三套预算。
5. 产品 Ultra 默认配置，作为真实产品 bundle 的外部有效性组；该组不承担单一机制识别。

所有组应预注册 task snapshot、prompt hash、harness commit、agent 拓扑、超时、失败分类与统计方案。重复次数应由 power analysis 决定，至少报告配对 bootstrap interval 和 task-level outcome。

### P2-1：四 agent 的产品拓扑需要区分“官方总数”与“源码推断”

**位置**：v2 第 14、52–53 行。

官方发布页确认 Ultra 默认协调四个 agent。`root + 3 子 agent` 的精确拓扑还结合了当前 fork 配置和公开 API 多代理设计。私有产品服务端是否始终保持这一拓扑仍属未知。建议写成：

> Ultra 官方默认协调四个 agent；结合当前 fork 与公开 Multi-agent API，可观察实现形态为 root 加最多三个并发子 agent。私有产品调度是否动态改宽未披露。

### P2-2：ALE 冲突应补充指标定义和 living snapshot

**位置**：v2 第 248 行。

`53.6` 与 `52.7%` 的冲突记录准确。ALE 同时维护 full pass rate 和 partial-credit mean score，并且是持续更新的 living benchmark；分数需要绑定日期、split、harness、effort 和任务快照。[ALE 排行榜](https://agents-last-exam.org/leaderboard)、[ALE 论文](https://arxiv.org/abs/2606.05405)

建议补充：OpenAI 发布页没有说明 `53.6` 与 `52.7` 的指标或快照差异，当前不能选取其中一个作为唯一真值，也不能从 Fable 基线反推出正式 `max-medium` 消融。Ultra 未在 ALE 上报告。

### P2-3：Terminal-Bench 的 `28 / 26` 应称“统计口径未消解”

**位置**：v2 第 249 行。

新闻页称修复 28 个任务；Harbor 数据页称修改 26 项。两处可能分别统计受影响任务、最终修改项或版本工件。公开材料没有解释。建议使用“未消解的计数差异”，避免写成已经证明维护方自相矛盾。

### P2-4：METR 持续性解释应保留假设语气

**位置**：v2 第 257–259 行。

System Card 对异常 cheating 信号提出的解释包含更强指令遵循和旨在提高 persistence 的训练。该说明属于 OpenAI 的可能解释，尚未形成受控因果消融。建议把“OpenAI 将该信号与……”改为“OpenAI 提出该信号可能与……共同有关”。

### P2-5：`1.8–3.1 pp` 应始终配套统计未知声明

**位置**：v2 第 17、58、223–229 行。

第 229 行已经说明没有置信区间、重复次数和配对检验。建议在第 17 和第 58 行首次引用分差时同步加上“点估计”一词，防止读者先把三个正差理解为已证明稳定显著。

## 二、已准确且应保留的内容

1. 三项公开表格数字和五个算术差值全部正确：BrowseComp `84.4 / 90.4 / 92.2`，SEC-bench Pro `45.8 / 71.2 / 74.3`，Terminal-Bench 2.1 `85.6 / 88.8 / 91.9`。
2. Ultra 默认四 agent、16-agent 只出现在 BrowseComp 与 SEC-bench Pro 交互图、16-agent 精确坐标未公开，判断准确。
3. v2 没有从交互图编造 latency、cost 或 16-agent 数字，符合视觉证据边界。
4. MRCR 与 GraphWalks 四行分数和差值准确。
5. v2 明确区分合成长上下文测试与 agent loop，拒绝用 MRCR / GraphWalks 证明 Goal、compaction、resume 或持久状态，判断准确。
6. ALE `53.6 / 52.7` 与 Terminal-Bench `28 / 26` 的公开冲突被保留，没有擅自选边。
7. v2 明确指出公开 benchmark 没有直接测跨进程重启、Goal SQLite、token-budget 中断恢复和多轮 compaction。这是 durability 章节最重要的正确结论。
8. 消融任务集已经包含人为崩溃、进程重启、thread resume、三类预算中断、共享写冲突和错误 verifier，方向正确。
9. 指标已覆盖恢复后首个正确动作、objective drift、重复工作、状态一致性、权限越界和隐藏验证，明显强于只看最终 pass rate。
10. METR Time Horizon 结果因异常 cheating 信号未被视为稳健时间地平线，负面证据被正确保留。

## 三、仍属未知的项目

| 未知项 | 对结论的影响 |
|---|---|
| 三项 Ultra 图各点的 reasoning effort、重复次数和置信区间 | 无法判断统计显著性和 effort 混杂 |
| BrowseComp、SEC-bench Pro 的 16-agent 精确分数、延迟、token 与成本 | 无法估计 4→16 边际收益和收益递减 |
| Ultra 产品 root/worker prompt、预算分配、重试、综合器和停止策略 | 无法把 bundle 增益分给具体机制 |
| OpenAI Terminal-Bench 的 harness commit、seed、硬件、网络、任务 timeout 与原始轨迹 | 无法复算 `88.8 / 91.9` 或解释 GPT-5.5 差异 |
| ALE `53.6 / 52.7` 的指标、split、task snapshot 和运行配置 | 无法确定唯一可引用 Sol 数值 |
| MRCR v2 与 GraphWalks 的精确 dataset commit | 无法确认发布分数使用哪次修复后的样本 |
| GraphWalks `256k / 1mil` 的字符或 token 口径 | 无法把标签解释为精确 token 长度 |
| GPT-5.6 训练、后训练或调参是否接触公开静态 benchmark | 无法排除污染和 benchmark-specific optimization |
| Ultra 在共享可变状态、跨重启、两次以上 compaction 和预算中断恢复上的受控结果 | 无法支持 durability 因果结论 |
| OpenAI 选择只报告三项 Ultra 评测的预注册规则 | 无法量化选报偏差 |

## 四、建议给 v3 的最小修订集

1. 把所有“模型贡献”改成“发布表配置分差”，直到同 harness、同预算实验可用。
2. 把所有“并行探索与综合带来”改成“Ultra bundle 与正分差相关”，并在同段列出未分离机制。
3. 新增 Ultra 选报小节，明确六项未报告评测和三个已报告 benchmark 的污染、饱和、快照与任务分布限制。
4. 修正 Terminal-Bench 推断：`85.6` 与 `83.4 ± 2.2` 无法直接互换，差异原因未知。
5. 给 MRCR、GraphWalks 标注评分函数、样本数、长度字段和 dataset commit 未知；把 `-0.2 pp` 写成近似持平。
6. 给 ALE 冲突补充 pass-rate / score 双指标、living benchmark 和 Ultra 未报告。
7. 把消融设计改成明确实验组，加入 `1 / 4 / 16`、等总 token、等 wall-clock、等成本及产品 Ultra 外部有效性组。
8. 用 power analysis 决定重复次数；保留配对任务结果、bootstrap interval、原始轨迹 hash 和失败分类。
9. 保留 v2 对 durability 的严格边界；该部分无需降级。

## 五、一手资料

- [OpenAI GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)
- [Terminal-Bench 2.1 维护方排行榜](https://www.tbench.ai/leaderboard/terminal-bench/2.1)
- [Terminal-Bench 2.1 发布说明](https://www.tbench.ai/news/terminal-bench-2-1)
- [Terminal-Bench 2.1 Harbor 数据集](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench-2-1/6)
- [Agents' Last Exam 论文](https://arxiv.org/abs/2606.05405)
- [Agents' Last Exam 排行榜](https://agents-last-exam.org/leaderboard)
- [DeepSWE 论文](https://arxiv.org/html/2607.07946v1)
- [BrowseComp 介绍](https://openai.com/index/browsecomp/)
- [BrowseComp 论文](https://arxiv.org/abs/2504.12516)
- [SEC-bench Pro 论文](https://arxiv.org/abs/2605.26548)
- [SEC-bench Pro 维护站](https://sec-bench.github.io/)
- [OpenAI MRCR 数据卡](https://huggingface.co/datasets/openai/mrcr)
- [OpenAI GraphWalks 数据卡](https://huggingface.co/datasets/openai/graphwalks)
- [本项目 benchmark 独立审计](benchmark-and-eval-audit.md)

