# GPT-5.6 Sol / Ultra 长程任务评测证据独立审计

> 审计日期：2026-07-12（Asia/Shanghai）  
> 范围：Ultra 的 1 / 4 / 16-agent 消融，以及 Terminal-Bench 2.1、DeepSWE、Agents' Last Exam、GeneBench-Pro、BrowseComp、SEC-bench Pro、OpenAI MRCR v2、GraphWalks  
> 证据边界：只采用 OpenAI 官方页面、评测维护方页面、评测论文与评测数据集。发布页未披露的配置和数值统一标为未知。

## 结论先行

公开证据支持三个相互独立的结论。

1. **OpenAI 发布表中，单代理 Sol 相对 GPT-5.5 的分差是当前提升的主体。** Sol 相对 GPT-5.5 的提升为：BrowseComp `+6.0 pp`、SEC-bench Pro `+25.4 pp`、Terminal-Bench 2.1 `+3.2 pp`、DeepSWE `+5.7 pp`、GeneBench-Pro `+16.7 pp`。部分对比同时混有 reasoning-effort 差异，属于“模型更替后的系统分差”，不能全部归因于权重变化。长上下文的结果呈混合状态：MRCR 256K–512K 提升 `+10.0 pp`，MRCR 512K–1M 下降 `-0.2 pp`，GraphWalks 两档分别提升 `+17.0 pp` 和 `+31.7 pp`。[OpenAI GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)
2. **Ultra 的四代理分数增益稳定为正，绝对幅度集中在 `1.8–3.1 pp`。** BrowseComp 为 `90.4% → 92.2%`，SEC-bench Pro 为 `71.2% → 74.3%`，Terminal-Bench 2.1 为 `88.8% → 91.9%`。换算成剩余错误的相对减少量，三项分别约为 `18.8%`、`10.8%`、`27.7%`。OpenAI 没有给出置信区间、重复次数或配对检验，统计显著性未知。[OpenAI GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)
3. **Ultra 的公开证据具有明显的任务选择边界。** OpenAI 只在三项适合并行搜索或并行探索的评测上报告 Ultra；Agents' Last Exam、DeepSWE、GeneBench-Pro、OSWorld、MRCR 和 GraphWalks 均无 Ultra 结果。发布页只在 BrowseComp 和 SEC-bench Pro 的交互图中展示 16-agent 配置，正文和汇总表没有给出 16-agent 精确坐标。当前证据可以支持“并行代理改善选定任务的分数—延迟前沿”，尚不足以支持“多代理普遍改善所有长程任务”。[OpenAI GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)

总体判断：**长程表现来自模型能力、推理预算、代理编排三层叠加。当前公开分数显示单代理系统更替带来的分差最大，Ultra 在选定任务上继续削减剩余错误并缩短墙钟时间。状态持久化、跨上下文恢复、数日运行稳定性未被这些 benchmark 直接测量。**

## 1. 证据等级与术语

| 标记 | 含义 |
|---|---|
| O | OpenAI 官方发布页、系统卡或官方产品文档 |
| B | 评测作者的论文、数据集、官方排行榜或维护方说明 |
| D | 由已公开数字直接计算的差值或比例 |
| U | 公开资料没有披露，或不同来源存在无法消解的冲突 |

三个计算层必须分开：

- **模型提升**：同一发布表中的 GPT-5.6 Sol 单代理与 GPT-5.5 对比。
- **推理预算提升**：同一模型在 medium、high、xhigh、max、Pro 等不同推理预算下的对比。
- **多代理扩展收益**：同一模型从一个 agent 扩展到四个或十六个 agent 后的变化。

OpenAI 的产品文档把 Max 定义为给单个任务更多推理时间，把 Ultra 定义为由 subagents 并行处理可分割部分；Ultra 属于复合代理模式，不能与一个新的基础模型等同。[OpenAI Codex Models 文档](https://learn.chatgpt.com/docs/models)

## 2. 1 / 4 / 16-agent 消融：公开数字能说明什么

### 2.1 可核实分数

| 评测 | GPT-5.5 | Sol 单 agent | Sol Ultra，4 agents | 模型提升 | 4-agent 提升 | 剩余错误相对减少 | 16-agent 精确值 |
|---|---:|---:|---:|---:|---:|---:|---|
| BrowseComp | 84.4% | 90.4% | 92.2% | +6.0 pp | +1.8 pp | 18.8% | U：交互图展示，正文与表格未给数值 |
| SEC-bench Pro | 45.8% | 71.2% | 74.3% | +25.4 pp | +3.1 pp | 10.8% | U：交互图展示，正文与表格未给数值 |
| Terminal-Bench 2.1 | 85.6% | 88.8% | 91.9% | +3.2 pp | +3.1 pp | 27.7% | 未展示 16-agent 配置 |

来源：[OpenAI GPT-5.6 发布页正文、结果表和脚注](https://openai.com/index/gpt-5-6/)。差值和错误减少比例为 D 级算术派生。

### 2.2 延迟与成本口径

OpenAI 对图表口径给出四项关键限定：

- Ultra 默认运行四个 agent。
- 多代理延迟从 root agent 推导。
- 输出 token 与 API 成本汇总所有 agent 的 token。
- 图表中的延迟和成本来自生产行为的离线模拟；延迟按 fast API 速度模拟，成本按常规 API 价格模拟，真实结果可能显著不同。

因此，“向左上移动”同时包含两类证据：汇总表直接给出更高最终分数；更低延迟来自 OpenAI 的模拟口径。并行缩短墙钟时间与总计算量下降没有等价关系，四代理会增加总 token 和总成本。[OpenAI GPT-5.6 发布页脚注 4–6](https://openai.com/index/gpt-5-6/)

### 2.3 16-agent 的证据上限

发布页正文明确表示 BrowseComp 和 SEC-bench Pro 图中包含 16-agent 配置，并概括增加并行 agent 后分数—延迟前沿继续向更高分、更低延迟移动。页面没有在正文、脚注或汇总表中给出 16-agent 的精确分数、延迟、token、成本和置信区间。交互图的静态坐标未被官方文本接口暴露。

所以，16-agent 可引用结论只有：

- 配置确实参与了 BrowseComp 和 SEC-bench Pro 图示；
- OpenAI 报告其位于改善后的分数—延迟前沿；
- 精确数值、边际收益、统计区间和运行重复次数均为 U。

任何精确的 16-agent 分数都需要对官方交互图做可复核的视觉读取或获得 OpenAI 的底层图表数据。当前审计不填补该空白。

### 2.4 选择性披露风险

三项 Ultra 评测都允许把搜索空间或候选方案拆成相对独立的分支：网页检索、漏洞路径探索、终端任务的并行调查与验证。发布页没有报告强顺序依赖、共享可变状态、单一连续实验、跨日恢复等任务的 Ultra 消融。16-agent 又只出现在两项搜索宽度极大的评测中。

这构成外推限制：**公开消融证明并行宽度能够改善适配任务，尚未证明代理数量本身能够解决长程状态管理。**

## 3. 各评测逐项审计

### 3.1 Terminal-Bench 2.1

#### 测量对象

Terminal-Bench 2.1 包含 89 个终端任务，覆盖软件工程、系统管理、数据处理、模型训练和安全等工作。每个任务包含自然语言指令、Docker 环境、结果测试、参考解法和任务级时间限制；评分检查最终容器状态，允许 agent 自主选择实现路径。[Terminal-Bench 论文](https://arxiv.org/abs/2601.11868)、[Terminal-Bench 2.1 数据集](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench-2-1/6)

#### 时间、重复与配置

- 时间和资源上限按任务配置，官方排行榜禁止提交者修改。
- 官方 2.1 排行榜建议 `-k 5`，即每任务五次试验，并报告置信区间。
- 截至本次审计，评测维护方排行榜没有 GPT-5.6 条目；已验证榜首为 Codex CLI + GPT-5.5，`83.4% ± 2.2`。OpenAI 发布页中的 GPT-5.5 为 `85.6%`，GPT-5.6 Sol 为 `88.8%`，Ultra 为 `91.9%`。两处 GPT-5.5 数字不一致，说明 OpenAI 发布评测与维护方排行榜不是同一组可直接复算的运行。[Terminal-Bench 2.1 官方排行榜](https://www.tbench.ai/leaderboard/terminal-bench/2.1)、[OpenAI GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)
- OpenAI 没有披露 5.6 运行的重复次数、任务超时快照、硬件配置、网络策略、agent harness 版本和置信区间。

#### 坏题与版本修复

2.1 的存在本身说明基准数据质量对分数影响很大：

- Terminal-Bench 新闻页称 89 项中有 28 项被修复；问题包括 9 项外部依赖漂移、8 项资源预算不足，以及指令和测试不一致。[Terminal-Bench 2.1 发布说明](https://www.tbench.ai/news/terminal-bench-2-1)
- Harbor 数据集页称 26 项被修改，修改类型包括 bug、timeout、resource 和 reward-hacking robustness。[Terminal-Bench 2.1 数据集](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench-2-1/6)
- “28”与“26”是维护方两个页面之间的公开冲突。可能原因包括修改项与最终数据项的统计口径差异，官方没有在页面中解释。

#### 可解释结论

Ultra 相对单代理增加 `3.1 pp`，相当于把 `11.2%` 的剩余错误降至 `8.1%`。任务总数只有 89，汇总百分比又可能来自多次运行；缺少原始轨迹和重复次数时，无法判断这 `3.1 pp` 是否超过采样波动。该评测支持复杂终端执行能力，无法单独识别模型、Codex harness、推理预算和多代理调度各自贡献。

### 3.2 DeepSWE v1.1

#### 测量对象

DeepSWE 包含 113 个原创长程软件工程任务，覆盖 91 个活跃开源仓库和 TypeScript、Go、Python、JavaScript、Rust 五种语言。任务从零编写，参考实现不合并回上游；每项由手写 functional verifier 检查可观察行为。[DeepSWE 论文](https://arxiv.org/html/2607.07946v1)、[DeepSWE 官方站](https://deepswe.datacurve.ai/)

这里的“长程”是结构性定义：短提示对应大规模、多文件改动，agent 必须先探索仓库并恢复隐含规格。论文明确说明该词不表示已测量的人类小时或天数。

#### Harness、上限与分数

- 所有模型统一运行在固定版本 mini-swe-agent 上，只提供一个 bash 工具和共享提示；这提高模型横向可比性，同时牺牲各厂商原生 harness 的真实性。
- 每次 rollout 的唯一限制是 2.5 小时墙钟时间；没有 step 或 cost cap。7,174 个计分 rollout 中只有 67 个（0.9%）超时。
- OpenAI 发布页给 GPT-5.6 Sol `72.7%`、Terra `69.6%`、Luna `67.2%`、GPT-5.5 `67.0%`。DeepSWE 官方站对 Sol max 四舍五入为 `73% ± 3%`，平均每任务 `$8.39`、`60k` 输出 token、`61` agent steps；GPT-5.5 xhigh 为 `67% ± 6%`、`46k` 输出 token、`82` steps。[OpenAI GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)、[DeepSWE 官方榜](https://deepswe.datacurve.ai/)
- OpenAI 的 `+5.7 pp` 模型提升同时包含 max 与 xhigh 的 reasoning-effort 差异，不能视为纯模型架构增益。

#### 数据质量与污染控制

- 参考解从未公开合入上游，评测容器只含 base commit 的 shallow clone，降低了从 Git 历史直接恢复答案的风险。
- matched audit 中，独立 agent-judge 与 DeepSWE verifier 的判定分歧为 `1.4%`；对 SWE-Bench Pro verifier 的分歧为 `32.4%`。论文强调前者仍是 judge disagreement，不能当作真实错误率。
- OpenAI 另行审计 SWE-Bench Pro，agent pipeline 标记 `27.4%` 任务破损，人类审查标记 `34.1%`，最终估计约 30% 破损，并撤回先前推荐。这解释了 DeepSWE 采用原创任务和功能验证器的价值。[OpenAI SWE-Bench Pro 审计](https://openai.com/index/separating-signal-from-noise-coding-evaluations/)
- DeepSWE 论文明确把去污染限定为“评测发生时”的属性。任务、verifier 和轨迹公开后，未来训练仍可能摄入。

#### 选择偏差与限制

- 仓库必须活跃、至少 500 stars、采用宽松开源许可证，样本偏向知名公共工程项目。
- 小型单文件修改、bug localization 和非编码工作代表不足。
- binary pass/fail 不给部分完成分；代码质量、可维护性、性能、文档和防御式编程不计分。
- 单一固定 harness 与跨模型不同 reasoning effort 是明确的可比性限制。
- Sol `73% ± 3%` 与若干相邻配置的区间有重叠；榜首排序不等于差异已统计确认。

DeepSWE 是当前最能隔离“模型在新工程任务上的长程执行能力”的公开证据之一；它未测试 Ultra，无法证明多代理对共享仓库写入的收益。

### 3.3 Agents' Last Exam（ALE）

#### 测量对象

ALE 评估经济价值较高的专业工作流，涵盖 13 个产业集群、55 个子领域和 1,000+ 任务。任务在 Windows 或 Linux 沙箱中运行，使用真实专业软件，通过 CLI 与 GUI 完成文件、模型、表格、媒体、设计或报告等交付物。[ALE 框架文档](https://agents-last-exam.org/docs/ale/index.html)、[ALE 论文](https://arxiv.org/html/2606.05405)

论文中的任务来自专家已经完成的真实项目，原始人类工作通常持续数天或数周。评测 agent 每次运行设五小时墙钟上限；到时会终止 agent，并对 output 目录中已有 artifact 正常评分。论文运行的总超时率为 `3.8%`，Last-Exam tier 为 `6.4%`。

#### 指标冲突与 OpenAI 分数

ALE 区分两种指标：

- full pass rate：获得满分的运行比例；
- score：细粒度部分得分的平均值。

OpenAI 发布页正文称 GPT-5.6 Sol 达到 `53.6`，比 Fable 5 高 `13.1` 点；同页汇总表又列 `52.7%`，并列 GPT-5.5 `46.9%`、Fable 5 `40.5%`。这两个 Sol 数值存在 `0.9` 点冲突，页面没有给出原因、快照、任务 split、重复次数或原始轨迹。[OpenAI GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)

从 ALE 当前排行榜的指标定义和 GPT-5.5 数值量级看，OpenAI 表格更像 mean score；这是解释性推断，官方发布页没有明确标注。正文还称 Sol medium 比 Fable 5 高 `11.4` 点。若两句话使用同一 Fable 基线 `40.5`，可派生 medium 约 `51.9`、max `53.6`，max 相对 medium 约 `+1.7 pp`。该派生依赖同一快照假设，只能标为 D/U。

#### 模型与 harness 混杂

ALE 论文专门做过模型—harness 对照：固定 OpenClaw harness 替换 12 个模型，full-pass spread 为 `16.8 pp`；固定 GPT-5.5 替换五种 harness，spread 为 `4.9 pp`；固定 Opus 4.7 替换三种 harness，spread 为 `7.2 pp`。这一结果表明模型选择在该实验中解释的分差更大，harness 仍可移动 5–7 个百分点。[ALE 论文 D.4](https://arxiv.org/html/2606.05405)

#### 污染与选择偏差

- 论文版本共有 1,490 个实例，只公开 150 个（约 10%），其余进入私有池并计划滚动替换。这是强于全公开静态基准的污染控制。
- 评测只纳入可在计算机上执行且有可验证 artifact 的工作；不可自动验证、依赖主观长期协作或物理世界执行的职业活动被系统性排除。
- 真实专业任务被压缩到五小时 agent cap，测得的是受限执行能力。
- ALE 是 living benchmark。官网当前称 1,500+ 任务和 300+ 专家，论文 v2 记录 1,490 实例和 250+ 专家。任何分数都必须绑定评测日期和任务快照。
- OpenAI 未报告 Ultra 在 ALE 上的结果。ALE 不能作为 Ultra 多代理收益证据，只能作为 Sol 模型与推理预算证据。

### 3.4 GeneBench-Pro

#### 测量对象

GeneBench-Pro 包含 129 个计算生物学问题，覆盖 10 个领域、21 个子领域。每项提供杂乱数据、简短实验背景和与决策相关的目标 estimand；agent 需要探索数据、选择方法、做诊断、修订分析路径并返回可确定评分的 JSON 结果。[OpenAI GeneBench-Pro 发布页](https://openai.com/index/introducing-genebench-pro/)

任务在隔离 workspace 中运行，提供 Python、科学计算库和 PLINK 2.0 等基础栈。数据由已知完整因果结构的生成过程合成，使评测方可以检验合理分析是否落入容差范围，并用 ablation 验证错误分析会失败。129 项中有 82 项送交外部领域专家审查。

#### 分数与推理预算

- GPT-5.6 Sol 在最高常规 reasoning level 为 `28.7%`；Pro mode 为 `31.5%`，同模型额外测试时计算带来 `+2.8 pp`。
- GPT-5.5 为 `12.0%`，Sol 常规最高档相对提升 `+16.7 pp`。
- 外部专家估计人类完成一题通常需要 20–40 小时；该数字是主观人类工时估计，不能当作 agent 的运行时长。
- OpenAI 没有披露每题 agent 的墙钟上限、step cap、重复次数、置信区间和失败重试策略。
- Ultra 未报告。

#### 选择偏差与污染

合成数据降低了从公开数据集中记忆答案的风险，也允许确定性评分。代价是任务世界由评测作者的生成模型定义，对真实生物数据中的未知机制、数据采集偏差和开放式目标覆盖有限。只有 82/129 项接受外部专家审查。该评测强测“分析判断链”，不测跨天实验管理、湿实验反馈和多代理协作。

### 3.5 BrowseComp

#### 测量对象

BrowseComp 是 1,266 个短答案网页检索问题。问题由人类从答案反向构造，需要通过多个纠缠线索定位难找事实。答案短、理论上唯一，评分简单；它测量持续搜索、查询重构和跨网页证据组合。[OpenAI BrowseComp 介绍](https://openai.com/index/browsecomp/)、[BrowseComp 论文](https://arxiv.org/abs/2504.12516)

原始人工验证中，1,255 个问题只有 367 个在最多约两小时搜索中被标为可解；其中 317 个答案与 reference 一致，agreement 为 `86.4%`。这提示基准虽追求单一答案，仍存在网页变化、解释分歧或 reference 风险。

#### 分数与 Ultra

- GPT-5.5 `84.4%`；Sol 单代理 `90.4%`，模型提升 `+6.0 pp`。
- Sol Ultra 四代理 `92.2%`，多代理提升 `+1.8 pp`，相对减少剩余错误约 `18.8%`。
- 16-agent 只存在于交互图；精确分数、延迟和成本未在文本披露。
- GPT-5.6 运行的搜索工具、最大网页数、墙钟上限、重复次数、答案聚合策略与引用要求均未披露。

#### 污染、饱和与选择偏差

- 数据集自 2025 年起公开并附 canary，要求避免训练数据摄入。canary 只能帮助过滤，无法证明所有训练管线都已排除。
- OpenAI 在原始论文中明确说明当时的 Deep Research 接受过专门面向 BrowseComp 类型任务的训练；这使原始成绩带有 benchmark-specific training confound。GPT-5.6 是否接触过问题、答案或任务生成模板为 U。
- 问题按当时模型无法解决、搜索引擎前页找不到、普通人十分钟难解等标准筛选，天然偏向稀有事实和 verification asymmetry，和真实用户的开放式研究分布不同。
- 90% 以上的当前成绩显示基准接近饱和。后续独立研究指出静态 BrowseComp 可能奖励模型内部记忆加网页验证；这是对当前 92.2% 外推的实质限制。[LiveBrowseComp 论文](https://arxiv.org/abs/2605.28721)

BrowseComp 能证明高强度并行搜索的收益，不能证明长期项目状态、代码修改一致性或跨上下文恢复。

### 3.6 SEC-bench Pro

#### 测量对象

OpenAI 使用 2026 年 5 月的 183-instance 版本：103 个 V8 和 80 个 SpiderMonkey 历史漏洞，包含 type confusion、use-after-free、越界访问、sandbox bypass、JIT、整数和 race-condition 等类型。agent 得到 vulnerable historical source tree、相关源码路径、instrumented binary、允许的运行参数以及宽泛漏洞和错误类别，需要构造可执行 PoC。[GPT-5.6 System Card §9.1.2.4.3](https://deploymentsafety.openai.com/gpt-5-6)、[SEC-bench Pro 论文](https://arxiv.org/html/2605.26548)

成功要求 PoC 在 vulnerable、target-patched 和 latest-upstream 三个镜像上产生一致的目标归因证据。评测 harness 结合执行日志与 LLM judge，判定 verified / unsure / invalid；论文中的 unsure 会人工裁决。

#### 时间与验证

- 评测论文的标准 agent budget 为每实例 5,400 秒（90 分钟）。
- 每个 PoC 在每个镜像上单次执行最多 300 秒，最多重试三次。
- 论文显示只按 vulnerable-image crash 会把五个配置的 117 个真实 verified configuration-instance 夸大为 168 个，增加 `43.6%`；三镜像归因降低了无关 crash 得分。
- OpenAI 发布页只说明其结果按 output token 展示，并给出模拟 latency；没有确认 GPT-5.6 多代理运行是否严格沿用论文的 5,400 秒 agent budget、judge 型号、重试和手工裁决口径。

#### 分数与互补性

- GPT-5.5 `45.8%`；Sol 单代理 `71.2%`，模型提升 `+25.4 pp`。
- Ultra 四代理 `74.3%`，增加 `+3.1 pp`，相对减少剩余错误约 `10.8%`。
- 16-agent 精确数值未披露。
- 原始论文在旧模型上发现 Codex 与 Claude Code 解题集合高度互补：两者 union 为 V8 `37.9%`、SpiderMonkey `48.8%`，单配置都低于 40%。这提供了“并行异质搜索可以扩大覆盖”的机制证据；它与同模型 Ultra 四代理仍是不同实验，不能直接相加。

#### 版本、污染与选择偏差

- 当前 SEC-bench Pro 官方站已显示包含 Linux 的 344-instance 版本；OpenAI 明确使用较早的 183-instance May snapshot。两套排行榜不可直接比较。[SEC-bench Pro 官方站](https://sec-bench.github.io/)
- 实例来自已披露、带 PoC、带修复且可重建的历史漏洞。漏洞报告和 fix 可能出现在预训练语料中；评测时虽然隐藏原 PoC、patch、crash trace 和详细报告，模型仍可能记住公共漏洞模式或补丁。污染程度未知。
- 构建管线只接纳有 PoC、有 fix、能重建的漏洞，偏向高严重度、bounty-qualified、crash-observable 的 JS 引擎问题。未披露漏洞、逻辑安全缺陷、非崩溃类漏洞代表不足。
- 任务提供相关源码路径和漏洞大类，搜索空间小于真实零日起点。
- LLM judge 会引入模型依赖；OpenAI 没有披露该次 judge 的型号和独立复核率。
- 安全评测采用降低 safeguards 的条件，产品默认安全策略下的可达能力可能不同。

### 3.7 OpenAI MRCR v2，8 needles

#### 测量对象

MRCR（multi-round co-reference resolution）把 2、4 或 8 个相同请求藏入由相同分布生成的长对话中，再要求模型逐字复现第 i 个目标回答。8-needle 版本同时要求顺序区分和大段内容复制。评分使用 Python `SequenceMatcher` ratio；回答必须带正确的 10 字符 hash，否则为零分。每个长度 bin 有 100 个样本。[OpenAI MRCR 数据集](https://huggingface.co/datasets/openai/mrcr)

#### 分数

| 长度档 | GPT-5.5 | Sol | 差值 | Terra | Luna |
|---|---:|---:|---:|---:|---:|
| 256K–512K | 81.5% | 91.5% | +10.0 pp | 89.6% | 41.3% |
| 512K–1M | 74.0% | 73.8% | -0.2 pp | 72.5% | 41.3% |

来源：[OpenAI GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)。第二档直接否定了“Sol 在所有百万 token 长上下文档位都优于 GPT-5.5”的假设。

#### 数据质量与外推限制

- 数据集 2025-12-05 修复过生成 bug：约 10% datapoints 含过多 target needles，约 5% ground truth 错误。发布页称 v2，但没有给出具体 dataset commit；是否使用修复后全部样本只能从日期推测。
- MRCR 是一次请求中的合成检索与精确复制，不包含工具调用、计划、环境状态、压缩、恢复、子代理或数小时执行。
- 分数可以支持“上下文内检索和顺序区分”，不能直接支持“长程 agent 状态管理”。
- 每 bin 仅 100 样本，且使用连续 similarity ratio；小数差异应结合方差解释，发布页没有置信区间。

### 3.8 GraphWalks BFS

#### 测量对象

GraphWalks 把有向图编码为长 edge list，要求模型执行 BFS 或查找 parent 节点。发布页只报告 BFS。评分把模型输出和答案转成集合，计算 precision、recall 和 F1。[OpenAI GraphWalks 数据集](https://huggingface.co/datasets/openai/graphwalks)

数据集共 1,150 样本：短档 650（350 parents + 300 BFS），长档 500（250 parents + 250 BFS）。公开 schema 的长度字段是 `prompt_chars`；OpenAI 发布表使用 `256k` 和 `1mil` 标签，却没有在表格脚注中明确这些标签的字符/token 口径和采样子集。

#### 分数

| 长度档 | GPT-5.5 | Sol | 差值 | Mythos 5 | Mythos Preview | Opus 4.8 |
|---|---:|---:|---:|---:|---:|---:|
| 256k F1 | 73.7% | 90.7% | +17.0 pp | 91.1% | 85.7% | 85.9% |
| 1mil F1 | 45.4% | 77.1% | +31.7 pp | 79.4% | 74.3% | 68.1% |

Sol 相对 GPT-5.5 的百万长度提升很大，同时仍低于 Mythos 5 的 `79.4%`。该表支持“显著提升”，不支持“该项绝对 SOTA”。[OpenAI GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)

#### 数据质量与外推限制

- 数据集在 2026-02-27 修复 400 个 parent 样本中的 24 个错误 ground truth，并修正 BFS 是否包含 revisited nodes 的提示歧义。
- 发布结果只报告 BFS，避开了已发现错误的 parent 子集；具体数据 commit 未披露。
- GraphWalks 是合成图算法执行，强测长输入中的结构化多跳推理。它不含 agent loop、工具、持久状态和真实项目噪声。
- F1 给部分正确集合较高分，与终端任务 pass/fail 或 ALE artifact score 不可横向等价。

## 4. 跨评测有效性矩阵

| 评测 | 真正测到的能力 | 时间/步数 | 污染控制 | 已知坏题/修复 | 主要选择偏差 | Ultra 证据 |
|---|---|---|---|---|---|---|
| Terminal-Bench 2.1 | 终端环境中的端到端执行 | 任务级 timeout/resource；官方榜 5 trials | 公开静态任务，风险存在 | 26/28 项统计冲突；依赖、资源、规格修复 | 89 项；容器任务；受任务维护质量影响 | 4-agent +3.1 pp；无 16-agent |
| DeepSWE | 原创新工程任务中的仓库探索与大改动 | 2.5h；无 step/cost cap | 评测时强；公开后会衰减 | verifier audit 1.4% disagreement | 热门宽松许可证 OSS；功能正确性限定 | 未报告 |
| ALE | 跨行业专业 artifact 交付 | 5h；到时评分已有产物 | 私有 90% + 滚动池，强 | living benchmark，快照会变化 | 只收数字化、可验证工作 | 未报告 |
| GeneBench-Pro | 计算生物学中的诊断、方法选择与修订 | agent 上限 U；人类估计 20–40h | 合成因果数据，强 | 82/129 外部专家审查 | 合成世界、量化 estimand、领域有限 | 未报告 |
| BrowseComp | 难找事实的并行网页搜索 | 模型上限 U；延迟离线模拟 | 全公开静态 + canary，较弱 | 人工 reference agreement 86.4% | 稀有事实、短答案、逆向构题 | 4-agent +1.8 pp；16-agent 定性 |
| SEC-bench Pro | 历史大项目漏洞 PoC 搜索与归因 | 90m 标准论文；PoC 300s×3 | 报告/patch 历史公开，风险较高 | 三镜像+judge 降低 crash 假阳性 | PoC-backed、fix-backed、提供源码路径 | 4-agent +3.1 pp；16-agent 定性 |
| MRCR v2 | 长上下文顺序检索与逐字复制 | 单次模型请求 | 合成但公开 | 10% needle / 5% GT bug 已修 | 合成写作对话、100 samples/bin | 未报告 |
| GraphWalks BFS | 长输入图结构多跳推理 | 单次模型请求 | 合成但公开 | parent 24/400 + BFS 歧义已修 | 合成 edge list；发布只报 BFS | 未报告 |

## 5. 对“长程 agent 能力”的证据拆解

### 5.1 强证据

- DeepSWE、Terminal-Bench 和 SEC-bench Pro 直接要求多轮探索、修改、执行、验证和失败恢复。
- ALE 与 GeneBench-Pro 要求在不完全信息下维持目标、修订方法并交付可评分 artifact。
- Sol 在这些单代理评测上相对 GPT-5.5 普遍提高，尤其是 SEC-bench Pro 和 GeneBench-Pro。
- Ultra 在三个高度可并行评测上继续提高最终分数，并由官方报告缩短模拟墙钟时间。
- SEC-bench Pro 旧模型轨迹显示不同 agent/scaffold 的成功集合具有互补性，为多代理覆盖率收益提供机制解释。

### 5.2 中等证据

- MRCR 和 GraphWalks 表明 Sol 能在很长输入中保持更强检索或结构推理。MRCR 最高档未提升，说明百万 token 能力仍有明显边界。
- Ultra 的剩余错误相对减少可达 10.8%–27.7%，接近饱和时的绝对百分点会低估实际错误削减。
- ALE 的模型—harness 对照表明两者都会改变结果，模型选择在该组实验中造成更大的 spread。

### 5.3 当前证据无法支持的命题

- 16 agents 的精确分数、延迟、token、成本和边际收益。
- Ultra 在数日任务、跨进程重启、context compaction、goal state 落盘、token budget 中断恢复上的因果收益。
- 四代理分数提升来自更好任务分解、更高总采样计算、并行独立尝试、专门 worker prompt 或 root synthesis 的各自比例。
- OpenAI 各评测中 Sol 单代理的统一 reasoning effort、统一 harness 和统一预算。
- 发布表中的百分点差异是否达到统计显著。
- 公开静态 benchmark 是否完全从 GPT-5.6 训练语料和后训练 eval feedback 中排除。

## 6. 应如何复现实验，才能真正分离三种收益

任何针对当前 Codex fork 的复现实验至少需要四组：

1. GPT-5.5，单代理，固定 harness、固定 wall-clock、固定 token budget。
2. GPT-5.6 Sol，单代理，与第 1 组使用相同预算，测模型提升。
3. GPT-5.6 Sol，单代理 max，放宽推理预算，测 test-time compute 提升。
4. GPT-5.6 Sol Ultra，四代理与十六代理，分别报告 root latency、critical-path latency、总 token、总成本、成功率和合并冲突。

每项至少报告：

- 数据集 commit / snapshot、模型 snapshot、harness commit、系统提示 hash；
- reasoning effort、agent 数量、最大并发数、subagent 深度；
- 每任务 wall-clock、总 token、非缓存 input、output、tool calls；
- 失败分类：timeout、context exhaustion、goal drift、重复工作、共享写冲突、无证据完成；
- 至少五个独立 seed、配对任务级结果和 bootstrap confidence interval；
- 单代理与多代理相同总 token 预算的 controlled comparison；
- 多代理相同墙钟预算与相同总计算预算两种口径。

只有这些控制齐全，才能判断 Ultra 的收益来自并行延迟、更多总计算、任务分工，还是模型已经学会了更好的子代理规划。

## 7. 可直接引用的数字清单

| 结论 | 数字 | 证据 |
|---|---|---|
| Ultra 默认 agents | 4 | [OpenAI GPT-5.6 发布页](https://openai.com/index/gpt-5-6/) |
| BrowseComp 单/四 agent | 90.4% / 92.2% | 同上 |
| SEC-bench Pro 单/四 agent | 71.2% / 74.3% | 同上 |
| Terminal-Bench 2.1 单/四 agent | 88.8% / 91.9% | 同上 |
| DeepSWE Sol | 72.7%；官方榜四舍五入 73%±3 | [OpenAI 发布页](https://openai.com/index/gpt-5-6/)、[DeepSWE](https://deepswe.datacurve.ai/) |
| DeepSWE Sol 资源 | $8.39/task，60k output，61 steps | [DeepSWE](https://deepswe.datacurve.ai/) |
| ALE Sol | 正文 53.6；表格 52.7%，冲突 | [OpenAI GPT-5.6 发布页](https://openai.com/index/gpt-5-6/) |
| GeneBench-Pro Sol / Pro | 28.7% / 31.5% | [OpenAI GeneBench-Pro](https://openai.com/index/introducing-genebench-pro/) |
| MRCR 256K–512K | Sol 91.5%，GPT-5.5 81.5% | [OpenAI GPT-5.6 发布页](https://openai.com/index/gpt-5-6/) |
| MRCR 512K–1M | Sol 73.8%，GPT-5.5 74.0% | 同上 |
| GraphWalks BFS 256k | Sol 90.7%，GPT-5.5 73.7% | 同上 |
| GraphWalks BFS 1mil | Sol 77.1%，GPT-5.5 45.4% | 同上 |
| Terminal-Bench 2.1 修复任务 | 新闻页 28；数据集页 26 | [新闻页](https://www.tbench.ai/news/terminal-bench-2-1)、[数据集](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench-2-1/6) |
| DeepSWE timeout | 2.5h；67/7,174（0.9%） | [DeepSWE 论文](https://arxiv.org/html/2607.07946v1) |
| ALE timeout | 5h；总超时率 3.8% | [ALE 论文](https://arxiv.org/html/2606.05405) |
| SEC-bench agent budget | 5,400s；PoC 300s×最多3次/镜像 | [SEC-bench Pro 论文](https://arxiv.org/html/2605.26548) |

## 8. 一手资料 URL

### OpenAI

- GPT-5.6 发布页：<https://openai.com/index/gpt-5-6/>
- GPT-5.6 System Card：<https://deploymentsafety.openai.com/gpt-5-6>
- Codex model / Max / Ultra 文档：<https://learn.chatgpt.com/docs/models>
- BrowseComp 介绍：<https://openai.com/index/browsecomp/>
- GeneBench-Pro 介绍：<https://openai.com/index/introducing-genebench-pro/>
- SWE-Bench Pro 数据质量审计：<https://openai.com/index/separating-signal-from-noise-coding-evaluations/>

### 评测维护方、论文与数据

- Terminal-Bench 2.1 发布说明：<https://www.tbench.ai/news/terminal-bench-2-1>
- Terminal-Bench 2.1 官方排行榜：<https://www.tbench.ai/leaderboard/terminal-bench/2.1>
- Terminal-Bench 2.1 Harbor 数据集：<https://hub.harborframework.com/datasets/terminal-bench/terminal-bench-2-1/6>
- Terminal-Bench 论文：<https://arxiv.org/abs/2601.11868>
- DeepSWE 论文：<https://arxiv.org/html/2607.07946v1>
- DeepSWE 官方榜：<https://deepswe.datacurve.ai/>
- ALE 论文：<https://arxiv.org/html/2606.05405>
- ALE 框架文档：<https://agents-last-exam.org/docs/ale/index.html>
- ALE 排行榜：<https://agents-last-exam.org/leaderboard>
- SEC-bench Pro 论文：<https://arxiv.org/html/2605.26548>
- SEC-bench Pro 官方站：<https://sec-bench.github.io/>
- BrowseComp 论文：<https://arxiv.org/abs/2504.12516>
- LiveBrowseComp 论文：<https://arxiv.org/abs/2605.28721>
- OpenAI MRCR 数据集：<https://huggingface.co/datasets/openai/mrcr>
- OpenAI GraphWalks 数据集：<https://huggingface.co/datasets/openai/graphwalks>

## 9. 未知项清单

- U1：BrowseComp 与 SEC-bench Pro 的 16-agent 精确坐标。
- U2：三个 Ultra 图的所有 reasoning-effort 点、坐标轴读数和置信区间。
- U3：OpenAI GPT-5.6 Terminal-Bench 2.1 的 agent harness、五次重复是否执行、硬件和每任务 timeout snapshot。
- U4：OpenAI GPT-5.6 SEC-bench Pro 的 90 分钟上限、judge 型号、人工裁决与原论文是否完全一致。
- U5：ALE `53.6` 与 `52.7` 差异的快照或统计原因。
- U6：MRCR v2 与 GraphWalks 的精确数据 commit。
- U7：公开静态 benchmark 在 GPT-5.6 预训练、后训练和调参流程中的去污染证明。
- U8：Ultra 在共享可变状态、长时间 checkpoint/resume、context compaction 和 token-budget 中断任务上的受控结果。

这些未知项直接限制了“所有长程任务都因 Ultra 获得同等提升”的结论。现有公开材料最稳健的表述是：**GPT-5.6 Sol 单代理已经显著提高若干长程能力；Ultra 通过四代理并行，在三个已选择且适合并行的评测上进一步提高 1.8–3.1 个百分点，并由 OpenAI 报告更短的模拟结果时间。**
