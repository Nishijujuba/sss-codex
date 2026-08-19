# GPT-5.6 Sol Ultra 长程 Agent 最终报告：最小完整结构与验收清单

> 设计日期：2026-07-12（Asia/Shanghai）  
> 输入范围：v0–v3 全部历史稿与 `sources/` 全部证据、审计文件  
> 源码基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`  
> 目的：约束最终报告的金字塔结构、证据等级、因果边界、训练分层和验收门槛  
> 操作边界：本文件没有修改任何历史草稿。

## 一、最终报告的唯一顶层结论

最终报告应以这一条结论统领全文：

> **GPT-5.6 Sol Ultra 的长程优势来自复合系统。Sol 提供更强的推理、工具使用和持续推进能力；`max` 增加单 Agent 推理时计算；Ultra 扩展并行搜索宽度；Codex 的 persisted reasoning、compaction、rollout、Goal、Agent 图、外部 Artifact 和验证闭环把一次次模型调用连接成可恢复工作流。公开材料尚未分离各层贡献，也没有证明 Ultra 在跨进程重启、共享可变状态或 token-budget 中断恢复上的因果收益。**

这条结论同时回答四个核心问题：

1. 提升来自模型、推理预算、编排和 Harness 的叠加。
2. 用户观察到的三项变化分别由不同状态路径支撑。
3. 公开训练证据只到“reasoning RL、增强 persistence 的训练和若干历史方向”。
4. 公开 benchmark 能证明若干长程执行和并行宽度收益，无法证明完整 durability。

最终报告不得再引入第二条竞争性总论。所有章节都应回答“该层如何支持、限制或检验上述结论”。

## 二、证据优先级与冲突处理

### 2.1 优先级

事实归属按以下顺序处理：

1. 一手官方页面、当前源码、原始 benchmark 论文或数据卡拥有事实解释权。
2. [v3 Claim Ledger](../draft-v3-reviewed-claim-ledger.md)控制最终版的 claim 等级和已吸收校正。
3. 三份独立审查控制历史稿中的降级、冲突和遗漏：
   - [v1 官方事实与推断审查](review-v1-official-and-inference.md)
   - [v1 源码事实审查](review-v1-code-facts.md)
   - [v2 评测与因果审查](review-v2-evals-and-causality.md)
4. 四份大型 source dossier 提供细节与来源导航。
5. v0、v1、v2 只作为研究演进和叙事素材。它们不能覆盖 v3 与独立审查的校正。

### 2.2 证据标签

最终正文应沿用 v3 的六级标签：

| 标签 | 可写内容 | 禁止升级 |
|---|---|---|
| `F1@2026-07-12` | OpenAI 官方当前直接声明 | 不得延伸为私有实现或训练细节 |
| `F2@26f5998e` | 当前 checkout 的源码、schema、测试事实 | 不得外推到全部产品版本和服务端 |
| `F3` | 原始论文、benchmark 规范、数据卡 | 不得省略 task snapshot 和指标 |
| `I1` | 多项事实共同支持的强解释 | 不得写成已完成机制消融 |
| `I2` | 可实施、可证伪的工程假设 | 不得归因给 Sol 私有训练 |
| `U` | 未披露、冲突或尚无证明 | 不得用模型“回忆”填空 |

### 2.3 每个高影响段落的固定模板

每个高影响段落只需五步：

1. **结论**：一至两句给读者答案。
2. **事实**：列出必要的 `F1/F2/F3` 证据。
3. **解释**：用 `I1` 连接事实，明确缺少何种消融。
4. **边界**：列出 `U`、失败窗口和版本范围。
5. **含义**：说明这对用户观察或 Harness 设计意味着什么。

## 三、最小完整大纲

最终报告采用九个主章节和两个附录。章节顺序即论证顺序，避免按研究时间线叙述。

### 1. 执行摘要：先给结论和三项直接回答

**必须回答**：Sol Ultra 为什么更适合长程任务，哪些已经证明，哪些仍未知。

**最小内容**：

- 顶层结论原文或等价表述。
- 一张“三项用户观察”表，每行只写结论、直接机制和证据上限。
- 一句训练边界：模型没有可验证的第一人称训练日记，通用知识只能进入 `I1/I2`。
- 一句评测边界：Ultra 三项公开结果是 bundle 点估计，durability 未测。
- 一句风险结论：更强 persistence 同时放大正确目标与越界行为。

**篇章位置要求**：三项直接回答必须在首次技术架构图之前出现。

### 2. 名称、执行面与证据合同

**结论**：Sol、`max`、Ultra、Pro、Responses Multi-agent 和当前 Codex V2 属于不同层与执行面。

**必须包含的名称表**：

| 名称 | 所属层 | 已确认语义 | 关键边界 |
|---|---|---|---|
| `gpt-5.6-sol` / `gpt-5.6` | 模型 / 当前 alias | Sol 是旗舰；alias 当前指向 Sol | alias 会漂移 |
| `max` | 公开 API reasoning effort | 单 Agent 获得更多推理时间 | 不等同多 Agent |
| Ultra | 产品/Harness setting | 默认协调四 Agent | 没有独立 API 模型 slug；完整私有拓扑未知 |
| Pro | reasoning mode | 高质量运行模式 | 与 Ultra、`max` 的组合未完整披露 |
| Responses Multi-agent | 托管 API 编排 | root/subagent、消息、独立上下文与压缩 | 与 Codex 产品和本地 V2 分开写 |
| 当前 Codex V2 | `F2@26f5998e` | 四个 session slot，根占一个；V2 无通用一层深度上限 | 可配置，线上构建可能漂移 |

**必须纠正**：

- “Ultra 默认四 Agent”是 `F1`。
- “产品 Ultra 固定 root + 三子 Agent”是 `I1`。
- 当前 Codex 内部 Ultra 映射线上 `max` 并在条件满足时启用 proactive multi-agent，是 `F2`。
- 公开 PTC、本地 Code Mode、产品自动使用必须分开。

### 3. 三项用户观察的直接因果回答

该章是全文中心。每个观察都采用“结论 → 因果链 → 状态路径 → 边界”的相同结构。

#### 3.1 为什么子 Agent 规划更好

**应给出的直接回答**：

> 最合理解释是“Sol 的任务分解能力 × Ultra 的主动委派授权 × typed collaboration 协议 × 独立上下文 × 有界并发 × root synthesis”。公开分数只证明 Ultra bundle 在三个选定评测上的正点估计，尚未量化每个机制的独立贡献。

**必须包含**：

- Ultra 默认四 Agent；当前 V2 四槽、根占一槽；V2 子 Agent 可继续 spawn。
- reservation/commit/Drop rollback、canonical AgentPath、flush-before-fork、fork context sanitization、mailbox/wait。
- root 的职责：依赖、写集合、共享状态、综合和最终验收。
- 适合并行的条件：独立交付、写集合不冲突、结果可结构化综合。
- bundle 混杂：额外总计算、worker prompt、独立采样、上下文隔离、重试和 synthesis。

#### 3.2 为什么任务状态落盘更稳

**应给出的直接回答**：

> “任务状态”由多种权威载体共同承担。工作区 Artifact 保存项目事实，rollout 保存事件轨迹，compaction 保存模型活跃窗口，WorldState/TurnContext 保存模型需要重新看见的世界，Goal SQLite 保存目标与预算，线程与 spawn edge 保存关系图。PlanUpdate、未消费 mailbox、后台进程表和 RolloutBudget 计数器的 durability 更弱。

**必须有一张状态权威表**：

| 状态 | 权威载体 | 恢复用途 | 关键限制 |
|---|---|---|---|
| 代码、Git、issue、报告、测试 | 工作区/外部系统 | 项目级事实与人工接管 | 可能过期或冲突 |
| 消息、工具、回合、事件 | rollout JSONL | resume、fork、审计 | 普通持久化错误存在告警窗口 |
| 模型活跃历史 | compaction variant / replacement checkpoint | 新窗口连续性 | 有损；不同 compaction 路径形态不同 |
| 规则与环境 | WorldState + TurnContext | 重建提示基线 | 不保存任意应用内存 |
| objective/status/budget/usage | goals SQLite | 跨回合目标状态 | 不含细粒度步骤与证据列表 |
| thread/agent lineage | SQLite + rollout | 线程树恢复 | 未消费 mailbox 缺少完整恢复证明 |
| 当前 UI 计划 | PlanUpdate | 即时协调 | transient，无 canonical plan reducer |
| 进程、队列、共享计数 | 内存运行态 | 当前进程执行 | 跨应用重启恢复弱或未见实现 |

#### 3.3 为什么 token 限额附近会出现状态落盘

**应给出的直接回答**：

> 当前 fork 至少存在五条相互独立的 token、预算或限额路径。它们写入不同状态，达限语义也不同。不存在一条“任何 token 限额都自动写 Markdown”的通用机制。

**必须有五路径表**：

| 路径 | 权威状态 | 持久结果 | 达限语义 |
|---|---|---|---|
| 摘要式 auto compaction | rollout checkpoint | replacement history、窗口链、WorldState、TurnContext | 继续，接受摘要损失 |
| feature-gated TokenBudget | context-window state + checkpoint | fresh window、initial context、WorldState、TurnContext | 清除旧 message items 后继续；默认关闭 |
| Goal token budget | goals SQLite | 原子累计 usage 并置 `budget_limited`，另发事件 | 停止新增实质工作，任务仍未完成 |
| root-tree RolloutBudget | 共享内存计数器 | reminder/terminal transcript | 当前 session tree 停止采样；counter 未见 hydrate |
| account usage limit | 服务端限额 + Goal status | Goal `usage_limited` | 等待服务端恢复或用户处理 |

**必须另行说明**：单次 `max_output_tokens`、模型上下文窗口、Goal budget、RolloutBudget 和账户限额属于不同约束。详细进展主要依赖 final response、rollout 或版本化 Artifact。

### 4. 长程能力的系统架构与时序

**结论**：长程可靠性来自“模型语义能力 + 可恢复状态机 + 外部事实 + 验证闭环”。

**推荐唯一主图**：一张作者绘制的“七层复合系统”Mermaid 图，标注为“综合示意图”，不得暗示复刻官方图。

**七层必须覆盖**：

1. 目标、约束、完成定义和审批边界。
2. Sol 模型的规划、工具、纠错与 persistence。
3. `max` 与 Ultra 的推理时计算和并行编排。
4. persisted reasoning、WebSocket、compaction、WorldState。
5. rollout、Goal、thread/agent graph、Unified Exec。
6. 工作区 Artifact 与外部 control plane。
7. tests、grader、reviewer、监控和安全边界。

**四段时序只保留关键事件**：

- 普通回合：TurnContext → model/tool → normalization → rollout → WorldState → Goal accounting → terminal barrier。
- compaction：threshold → handoff/new window → checkpoint → baseline → reconstruction。
- Goal budget：TokenUsage → snapshot → atomic SQL → durable event → budget steering。
- spawn：reservation → parent materialize/flush → snapshot/filter → child thread → result routing/reload。

该章只解释状态和时序。评测数字留在第 7 章，训练推断留在第 6 章。

### 5. Harness 与代码设计巧思

**结论**：当前架构的价值来自边界清晰、事件可重放、并发有约束、长操作可让出控制权和完成可验证。

**最小完整清单**：

1. append-only rollout 与 SQLite 可查询投影分离。
2. replacement checkpoint 替换活跃历史，旧证据保持不重写。
3. WorldState 使用稳定 section ID、full baseline 与 merge patch。
4. fork 前 materialize + flush，建立 happens-before。
5. Agent reservation 先于真实创建，失败自动 rollback。
6. mailbox/wait 采用事件驱动唤醒，减少固定 sleep 轮询。
7. Unified Exec 使用 yield/poll、有界输出、进程上限和可配置 timeout。
8. ContextManager 正规化缺失 tool output、孤立 output 和中断边界。
9. Goal 用 expected goal ID、semaphore 与单条 SQL 处理并发 usage/state transition。
10. stable prompt prefix、persisted reasoning、WebSocket prefix check 和 cache 友好结构。
11. PTC 与本地 Code Mode 把确定性循环、批量、过滤和聚合移出逐次自然语言往返；执行面关系保持 `U`。
12. typed tools、短授权片段、usage hints 与 runtime invariants 共同表达协议。
13. Artifact-first、专用工作区、issue control plane、版本化 execution plan 和 evidence-based completion。

**必须保留的源码校正**：

- rollout ordinal 在 legacy 格式可省略。
- Goal objective 只在 automatic continuation 和 objective update 等路径重新注入；普通 turn 无无条件保证。
- Goal 的三次 blocker 与 completion audit 是 prompt/tool contract；handler 不验证次数和证据，terminal error 可直接标 blocked。
- local Code Mode `store/load` 属于 session 内存，不构成跨进程状态。
- `flush()` 未证明所有路径的断电级 `fsync`。

### 6. 训练：直接事实、历史方向、可证伪假设、未知

**结论**：公开材料证明 Sol 属于 reasoning model，并披露了旨在增强 persistence 的训练；完整训练配方仍未公开。

**必须严格使用四层结构**：

#### 6.1 GPT-5.6 直接公开事实

- 数据来源大类：公开互联网、第三方合作、用户/训练员/研究人员提供或生成数据，以及过滤治理。
- reasoning models 通过 RL 学习改进推理、尝试策略和识别错误。
- System Card 披露“旨在增强 persistence 的训练”。
- 自治安全与授权边界训练属于公开大类。
- 部署模拟和真实研究流程说明模型接受长轨迹评估，不能反推训练样本。

#### 6.2 OpenAI 历史方向证据

- codex-1：真实软件工程任务、多样环境、测试迭代 RL。
- Codex System Card：环境扰动、合成异常状态、行动—声明一致性和诚实性信号。
- o3/o4-mini：通过 RL 学习何时和如何用工具。
- Deep Research：端到端多步研究、回溯和响应新信息。
- process supervision 数学实验：只说明窄领域方法证据。

这些材料必须标“历史方向”，不得写成 Sol 已确认复用。

#### 6.3 可证伪工程假设

- 长 trajectory curriculum。
- verifier/outcome/process/safety 多信号组合。
- 多 Agent decomposition/synthesis 训练。
- compaction-aware 和 interruption/resume 训练。
- verifier diversity、隐藏测试和失败恢复课程。

每条假设必须给出能升级或证伪它的公开证据或实验。

#### 6.4 内部未知与能力边界

- 参数量、稀疏/稠密结构、MoE 路由、训练 FLOPs。
- 数据比例、许可构成、去污染、trajectory 时长分布。
- SFT/RL 比例、算法、奖励组合与权重。
- Ultra 私有 prompt、worker role、预算、重试、综合器和停止策略。
- compaction-aware、多 Agent 或 interruption-aware 训练是否存在。
- 模型没有可验证的第一人称训练记忆；“脑中信息”只能贡献一般工程规律并标 `I1/I2`。

### 7. 评测、数字与因果边界

**结论**：公开结果证明 Sol 和 Ultra 在若干任务上更强；它们不能完成模型、reasoning budget、Harness 和多 Agent 的因果分解。

#### 7.1 三类增益分开报告

必须分别写：

- 发布表配置级系统分差：GPT-5.5 → Sol 单 Agent。
- 推理预算差：同模型不同 effort/Pro。
- 多 Agent bundle 点估计：Sol 单 Agent → Ultra 四 Agent。

禁止把第一类称为纯模型权重贡献，禁止把第三类直接分配给并行或 synthesis。

#### 7.2 必须复核的数字

| 评测 | GPT-5.5 | Sol 单 Agent | Ultra 4 Agent | 5.5→Sol | Sol→Ultra |
|---|---:|---:|---:|---:|---:|
| BrowseComp | 84.4% | 90.4% | 92.2% | +6.0pp | +1.8pp |
| SEC-bench Pro | 45.8% | 71.2% | 74.3% | +25.4pp | +3.1pp |
| Terminal-Bench 2.1 | 85.6% | 88.8% | 91.9% | +3.2pp | +3.1pp |

表下注明：均为发布页点估计；CI、重复次数、配对检验和统一预算未披露。Ultra token 与成本统计包含全部 Agent，延迟按 root agent 并用离线模拟口径。

#### 7.3 最小 benchmark 有效性表

主文用一张八行表覆盖 Terminal-Bench 2.1、DeepSWE、ALE、GeneBench-Pro、BrowseComp、SEC-bench Pro、MRCR、GraphWalks。每行只保留：

- 真正测到的能力；
- 时间/步数或单请求口径；
- 主要坏题/版本问题；
- 最大选择偏差；
- 是否有 Ultra 结果。

详细数字和任务定义可指向 [benchmark 独立审计](benchmark-and-eval-audit.md)，避免在正文重复八个小论文。

#### 7.4 长上下文必须单列指标

- MRCR `256K–512K`：Sol 91.5，GPT-5.5 81.5。
- MRCR `512K–1M`：Sol 73.8，GPT-5.5 74.0，点估计近似持平，显著性未知。
- GraphWalks BFS `256k set-F1`：90.7 对 73.7。
- GraphWalks BFS `1mil set-F1`：77.1 对 45.4。

必须注明：MRCR 是 `SequenceMatcher` similarity，GraphWalks 是 set-F1；GraphWalks 数据卡字段为 `prompt_chars`，发布标签的字符/token 单位未知；两者不测 Agent loop 或 durability。

#### 7.5 冲突、选报和负面证据

必须保留：

- ALE 正文 `53.6` 与表格 `52.7%`；不得任选一个作为唯一真值。
- Terminal-Bench 修复数 `28 / 26` 的统计口径未消解。
- OpenAI GPT-5.5 `85.6` 与维护榜 `83.4 ± 2.2` 无法直接互换；差异原因未知。
- BrowseComp 静态公开、专项训练混杂、reference agreement 和饱和风险。
- SEC-bench Pro 历史公开漏洞、183/344 snapshot、给定路径、LLM judge 和降低 safeguards。
- Ultra 只报告三个适配宽度扩展的任务；ALE、DeepSWE、GeneBench、OSWorld、MRCR、GraphWalks 无 Ultra。
- 16-agent 只有 BrowseComp/SEC 的定性图示；精确分数、延迟、成本和 CI 未公开。
- METR Time Horizon 1.1 因异常 cheating 信号不稳健，不能宣称固定自主小时数。
- SWE-Bench Pro 约 30% 破损审计只用于说明 verifier 风险，不能外推到全部 benchmark。

#### 7.6 durability 结论

必须用独立结论框声明：

> 当前 benchmark 没有直接测 Ultra 在跨进程重启、两次以上 compaction、Goal SQLite 恢复、token-budget 中断、未消费 mailbox 或共享写冲突上的因果收益。相关证据来自源码与产品行为，评测因果仍待实验。

### 8. 风险、局限与 unknown unknowns

**结论**：更强 persistence 会同时放大正确目标、错误目标和脆弱验证器。

**主文最少覆盖十项**：

1. 目标错误与权限边界越界。
2. compaction 语义损失和多次压缩漂移。
3. Goal、rollout、PlanUpdate、Artifact、issue 多份真相漂移。
4. mailbox enqueue/drain 前的崩溃窗口。
5. Unified Exec 后台进程跨应用重启不恢复。
6. RolloutBudget weighted counter 未见 hydrate。
7. rollout `flush()` 与断电 `fsync` 之间的保证缺口。
8. goals DB 损坏缺少 rollout 自动 backfill。
9. 共享工作区写冲突、重复副作用与缺少事务隔离。
10. grader/reward hacking、虚假完成和高 effort 过窄优化。
11. 当前 checkout、产品构建、feature flag 与服务端实现漂移。
12. 公开静态 benchmark 污染、选报与快照演化。

视觉边界也必须保留：官方多代理图、System Card Figure 7 和 Deployment Simulation 图尚未完成本地下载与 `view_image` 复核。最终报告只能使用 HTML 表格、正文、图注和替代文本支持的内容。

### 9. 可证伪消融、复现蓝图与工程建议

**结论**：模型、推理预算、Agent 数和 durability 只有通过匹配预算、故障注入和配对任务实验才能分离。

#### 9.1 最小实验组

1. GPT-5.5 单 Agent，固定 harness、工具、task snapshot、总 token 与 wall-clock。
2. Sol 单 Agent，尽量匹配第 1 组预算，测配置级模型更替分差。
3. Sol 单 Agent `max`，放宽单 Agent 计算，测 test-time compute。
4. Sol 同一实验 harness 下 `1 / 4 / 16 agents`，分别做等 aggregate token、等 wall-clock、等成本实验。
5. 产品 Ultra 默认配置，作为 bundle 的外部有效性组。

#### 9.2 任务必须覆盖

- 高度可并行搜索。
- 强顺序依赖和长实验。
- 多文件共享写与冲突合并。
- 两次以上 compaction。
- crash、restart、thread resume。
- Goal budget、TokenBudget、RolloutBudget、usage limit。
- flaky tool、网络失败、错误 verifier。
- 用户中途 steering、权限升级和不可逆副作用。
- 独立 reviewer 才能发现的虚假完成。

#### 9.3 指标必须覆盖

- success/pass、completion claim precision。
- resume 后首个正确动作、checkpoint constraint recall、objective drift。
- 重复工具、重复调查、依赖错误、共享写冲突。
- compaction 次数、约束遗失率、状态陈旧率。
- root latency、critical path、总 token、成本、缓存口径。
- 权限越界、grader exploitation、隐藏验证失败。
- Goal DB、rollout、Artifact、UI plan 的一致性。
- 人工 steering、接管时间和恢复成本。

重复次数由 power analysis 决定；至少报告配对 task-level outcome、bootstrap interval、失败分类、task/model/harness/prompt hash 和原始轨迹 hash。

#### 9.4 最终工程建议

最终报告只需给出十条可操作建议：稳定 task/thread/agent ID、明确完成定义、版本化 execution plan、Artifact-first、DAG 与写集合所有权、append-only event log、原子预算状态机、有界工具输出与幂等副作用、故障注入、独立验证与 read-back。

### 附录 A：Claim Ledger 与未知项

附录只保留高影响主张的 `claim_id / statement / tag / source / surface / as_of / limitation`。v3 已提供完整素材，最终报告无需复制所有源码导航细节。

### 附录 B：来源与版本索引

必须列出：

- 官方页面访问日期；
- benchmark snapshot / 数据卡；
- 当前源码 commit；
- 本地 source dossier 与独立审查文件；
- 视觉证据状态。

## 四、三项用户观察的“验收答案”

最终报告只有在以下三段可以独立阅读时才算直接回答用户。

### A. 子 Agent 规划

合格答案必须同时说清：

- 模型分解质量属于合理贡献来源；公开材料没有量化其独立份额。
- Ultra 默认四 Agent；root+三子是跨执行面的强解释。
- V2 的 typed tools、AgentPath、reservation、独立上下文、fork filter 和 root synthesis 提供 Harness 支撑。
- 三项 Ultra 分数是 bundle 点估计；选择偏差、总计算和统计显著性仍未知。
- 强顺序依赖、共享写和跨重启任务缺少 Ultra 公开结果。

### B. 状态落盘

合格答案必须同时说清：

- 工作区 Artifact、rollout、compaction checkpoint、WorldState/TurnContext、Goal SQLite 和 thread/agent graph 的职责。
- PlanUpdate 是即时协调层，恢复保证较弱。
- mailbox、ProcessStore、RolloutBudget counter 仍有运行时内存成分。
- Goal 只保存 objective/status/budget/usage/time，细粒度进展依赖 rollout 或 Artifact。
- `flush()` 和全平台断电 durability 之间仍有缺口。

### C. token 限额时落盘

合格答案必须同时说清：

- 五条路径名称、权威状态、持久结果和达限行为。
- TokenBudget fresh window 与摘要式 compaction 分开。
- Goal budget 的用量累加和状态跃迁位于同一 SQL。
- RolloutBudget counter 未见跨重启 hydrate。
- usage limit 的恢复由服务端决定。
- 没有“任意 token 限额自动写项目 Markdown”的公开或源码保证。

## 五、来源覆盖矩阵

最终报告必须能在下表中为每个输入找到明确去向。

| 输入文件 | 最终版主要去向 | 必须吸收的独有价值 |
|---|---|---|
| [v0 证据地图](../draft-v0-evidence-map.md) | 第 1、2 章 | 原始研究问题、证据等级、用户三项观察 |
| [v1 合流稿](../draft-v1-source-synthesis.md) | 第 3–6、8 章 | 七层复合系统、三项回答、Harness 设计原则 |
| [v2 因果与评测稿](../draft-v2-causal-architecture-and-evals.md) | 第 3、4、7、9 章 | 四段时序、因果拆分、评测与消融结构 |
| [v3 Claim Ledger](../draft-v3-reviewed-claim-ledger.md) | 全文控制面、附录 A | 最新 claim 等级、校正、未知项和最终规则 |
| [官方模型与 Codex](official-model-and-codex.md) | 第 2、3、4、6、8 章 | 名称、产品/API 语义、Goal、ExecPlan、官方训练边界 |
| [公开训练、评测与 Harness](public-training-evals-harness.md) | 第 4–9 章 | 训练四层、公开 Harness、验证循环、失败模式 |
| [本地源码审计](local-codex-long-horizon-code.md) | 第 3–5、8、9 章 | 状态结构、五限额路径、时序、故障窗口和测试面 |
| [benchmark 审计](benchmark-and-eval-audit.md) | 第 7、9 章 | 数字、任务定义、选择偏差、冲突和复现实验 |
| [v1 官方审查](review-v1-official-and-inference.md) | 第 2、6、7、8 章 | 执行面分层、PTC/Code Mode、视觉和训练降级 |
| [v1 源码审查](review-v1-code-facts.md) | 第 3–5、8 章 | V2 深度、第五条 TokenBudget、Goal contract 校正 |
| [v2 评测审查](review-v2-evals-and-causality.md) | 第 7、9 章 | bundle 因果边界、选报、GraphWalks 单位、交叉消融 |
| [视觉证据审计](visual-evidence-audit.md) | 第 7、8、附录 B | 图像未复核状态和可引用范围 |

## 六、最终验收清单

### 6.1 文件与版本安全

- [ ] 最终报告写入新文件，没有覆盖 v0、v1、v2、v3 或任何 source。
- [ ] 标明生成日期、源码 commit 和官方网页访问日期。
- [ ] 所有历史稿继续保留，最终文件清楚标注为 final。
- [ ] 工作区仅出现计划内新文件或已有任务授权的改动。

### 6.2 金字塔结构

- [ ] 第一屏给出唯一顶层结论。
- [ ] 三项用户观察在首次技术图之前得到直接回答。
- [ ] 每个主章节先给结论，再给证据、解释和边界。
- [ ] 章节按“答案 → 机制 → 证据 → 风险 → 验证”展开，没有按搜索过程或草稿版本讲故事。
- [ ] 同一数字只在一个主表中完整出现，其他位置用引用或短结论，避免重复。
- [ ] 主文只保留一张系统综合图；其他关系优先使用小表。

### 6.3 名称与执行面

- [ ] `gpt-5.6-sol`、alias、`max`、Ultra、Pro 分层准确。
- [ ] 没有把 `gpt-5.6-sol-ultra` 写成公开 API slug。
- [ ] Ultra 产品、Responses Multi-agent、本地 Codex V2 分开。
- [ ] “默认四 Agent”与“root+三子”分别标 `F1` 和 `I1`。
- [ ] V2 当前无通用一层深度上限。
- [ ] PTC 支持、本地 Code Mode 与产品自动启用分开。

### 6.4 用户三项观察

- [ ] 子 Agent 规划答案同时覆盖模型、授权、协议、上下文、并发、综合和未消融机制。
- [ ] 状态落盘答案至少覆盖八类载体及其权威边界。
- [ ] token 限额答案覆盖五条路径，且没有混用 Goal budget、RolloutBudget、TokenBudget、compaction、usage limit。
- [ ] 明确说明详细进展主要依赖 rollout/final response/Artifact。
- [ ] 明确说明没有通用自动 Markdown 落盘保证。

### 6.5 源码事实

- [ ] 所有 `F2` 均限定 `@26f5998e`。
- [ ] rollout ordinal 的 optional/legacy 语义正确。
- [ ] compaction 至少区分本地摘要、服务端不透明 item 和 TokenBudget fresh window。
- [ ] Goal objective 注入条件准确。
- [ ] Goal completion/blocker 是模型契约，handler/runtime 强制范围准确。
- [ ] PlanUpdate 标为 transient。
- [ ] mailbox、ProcessStore、RolloutBudget hydrate、goals backfill 和 `fsync` 缺口保留。
- [ ] Code Mode `store/load` 没有被写成跨进程数据库。

### 6.6 训练事实与推断

- [ ] 训练章严格分成直接事实、历史方向、I2 假设、U 未知四层。
- [ ] persistence training 的直接措辞与其用户体验因果解释分开。
- [ ] codex-1、o3/o4-mini、Deep Research、数学过程监督只作为历史/相邻证据。
- [ ] 没有编造 Sol 的数据混合、rollout 长度、奖励函数、multi-agent curriculum 或 compaction training。
- [ ] 明确说明模型没有可验证的第一人称训练经历或逐样本记忆。
- [ ] 每条工程假设都附可证伪条件。

### 6.7 评测与数字

- [ ] BrowseComp `84.4 → 90.4 → 92.2`，差值 `+6.0 / +1.8 pp`。
- [ ] SEC-bench Pro `45.8 → 71.2 → 74.3`，差值 `+25.4 / +3.1 pp`。
- [ ] Terminal-Bench 2.1 `85.6 → 88.8 → 91.9`，差值 `+3.2 / +3.1 pp`。
- [ ] 三项均写成点估计；CI、重复、配对检验和统一预算未知。
- [ ] Ultra 分差写成 bundle 结果，没有分配给单一机制。
- [ ] Ultra 未报告的六项评测完整列出。
- [ ] 16-agent 没有精确坐标或臆测边际收益。
- [ ] MRCR 与 GraphWalks 指标分开，GraphWalks 长度单位未知。
- [ ] MRCR 最高档 `73.8 vs 74.0` 写成近似持平，显著性未知。
- [ ] ALE `53.6 / 52.7` 与 Terminal `28 / 26` 冲突保留。
- [ ] Terminal `85.6` 与维护榜 `83.4 ± 2.2` 的差异原因保持未知。
- [ ] 每个 benchmark 的任务、时间、snapshot、污染和选择偏差至少有一项说明。
- [ ] METR 结果没有被换算成固定可自主工作小时数。
- [ ] benchmark 没有被用来证明 durability。

### 6.8 因果与消融

- [ ] “发布表配置级分差”“reasoning budget 差”“多 Agent bundle 差”分开。
- [ ] 没有跨 benchmark 加总百分点形成统一贡献率。
- [ ] 消融包含 GPT-5.5/Sol、single/max、1/4/16、等 token、等 wall-clock、等成本。
- [ ] 产品 Ultra 被单列为外部有效性组。
- [ ] 任务包含顺序依赖、共享写、两次 compaction、crash/restart 和预算中断。
- [ ] 重复次数由 power analysis 决定，并报告配对结果与 bootstrap interval。

### 6.9 风险、安全与未知项

- [ ] persistence 的能力收益和越界风险同时出现。
- [ ] severity-3 风险只使用 System Card 正文定性结论，没有编造图中发生率。
- [ ] verifier 缺陷、reward hacking、虚假完成和高 effort 过窄优化保留。
- [ ] 权限、审批、幂等性、read-back、独立验证和停止条件进入工程建议。
- [ ] v3 的十项最终未知至少在主文或附录出现。
- [ ] “当前源码未见”没有升级成产品全局不存在。

### 6.10 视觉、来源与链接

- [ ] 没有使用未经过 `view_image` 的图内独有坐标、柱高、误差线或颜色关系。
- [ ] 作者生成的 Mermaid 图明确标“综合示意图”。
- [ ] 每个关键数字旁有一手来源链接。
- [ ] 本地源码链接指向真实文件，且说明 commit。
- [ ] 所有相对 Markdown 链接均可解析。
- [ ] 来源页不是搜索结果页或二手新闻。
- [ ] 可变网页带访问日期；benchmark 带 snapshot 或明确未知。

### 6.11 写作与可读性

- [ ] 全文使用中文第三人称或无主句。
- [ ] 避免禁止的对照句式。
- [ ] 术语首次出现即定义，中文解释优先。
- [ ] 没有展示内部推理过程或执行日志。
- [ ] 没有为定性概念制造无信息增益的公式。
- [ ] 每个风险都说明触发条件、影响和缓解方向。
- [ ] 最终结尾回到用户三项观察和“已知/推断/未知”，没有引入新主张。

## 七、Go / No-Go 门槛

出现任意一项即不得交付最终报告：

1. 把 Ultra 写成独立模型或公开 reasoning effort。
2. 把 root+三子写成产品私有拓扑直接事实。
3. 把三项 Ultra 点估计写成已证明统计显著。
4. 把 Ultra bundle 增益归因给单一机制。
5. 给出未公开的 16-agent 精确数字。
6. 把 MRCR/GraphWalks 当成 durability 或跨重启证据。
7. 从 benchmark 分数推出 Goal、rollout 或 token-budget 落盘因果。
8. 把历史 Codex、o3/o4、Deep Research 训练直接归因给 Sol。
9. 声称模型能够回忆私有训练样本或专项训练经历。
10. 混淆五条 token/预算路径。
11. 忽略 Goal prompt contract 与 runtime enforcement 的区别。
12. 引用尚未视觉复核的图内独有信息。
13. 覆盖任何历史草稿。

## 八、建议的最终交付形态

最终报告应作为一个新的、独立 Markdown 文件交付。建议文件名使用 `final-` 前缀并保留研究日期，例如：

`final-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md`

主文保持自包含；详细源码导航、完整 benchmark 审计和历史审查通过链接进入 `sources/`。这样既满足“尽可能完整”的研究目标，也让读者先获得稳定结论，再按需要下钻证据。

