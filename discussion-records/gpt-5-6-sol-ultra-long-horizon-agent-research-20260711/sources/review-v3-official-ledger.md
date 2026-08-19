# `draft-v3-reviewed-claim-ledger.md` 官方 Claim Ledger 复核

> 复核对象：`../draft-v3-reviewed-claim-ledger.md`  
> 复核时间：2026-07-12（Asia/Shanghai）  
> 复核重点：`F1/I1/U` 边界、Ultra topology、PTC/Code Mode、training/persistence、图片状态  
> 约束：本文件只记录剩余修正项、准确项与最终版必须保留措辞；v3 保持不变。

## 一、仍需修正项

### 1. A07 仍把跨执行面收敛模式写成了产品 Ultra 的“可观察形态”

- **v3 主张**：A07“当前 Ultra 的可观察形态为 root + 最多三个并发子 Agent”，等级 `I1`。
- **问题**：官方发布页只直接声明“Ultra 默认协调四个 Agent”。Responses Multi-agent 的 root/subagent 拓扑与默认三个并发 subagent 是公开 API 执行面；四个 session slot 且根占一槽是当前 Codex checkout 的 V2 执行面。两条执行面呈现相同模式，产品 Ultra 的私有拓扑仍未公开，因此“产品可观察形态”措辞偏强。
- **证据边界**：
  - `F1`：Ultra 默认四 Agent。
  - `F1`：Responses Multi-agent 为 root/subagent，默认 `max_concurrent_subagents=3`。
  - `F2`：当前 Codex V2 默认四槽，根占一槽。
  - `I1`：`root + 3` 是跨公开 API 与当前 Codex V2 的收敛实现模式。
  - `U`：产品 Ultra 私有运行时是否固定 `root + 3`。
- **建议替换 A07**：

  > A07｜Responses API 与当前 Codex V2 都呈现“一个根线程占位、最多三个其他 Agent 并发”的收敛模式｜`I1`｜A05+A06｜该模式为产品 Ultra 默认四 Agent 提供强解释；产品私有拓扑仍为 `U`。

### 2. H04 把“本轮没有视觉读取”扩大成“精确数据未公开”

- **v3 主张**：H04 表示 16-agent 图的精确坐标、token、成本、CI 未公开。
- **问题**：发布页明确公开三张交互图，并在正文说明 BrowseComp 与 SEC-Bench Pro 含 16-agent 配置。当前审计无法下载图像、读取 hover 状态或执行 `view_image`，因此只能证明“本轮没有建立这些精确值”。它无法证明公开交互图中不存在坐标、token 或成本信息。发布页脚注还明确说明：多 Agent latency 从 root 推导，output token 与 API cost 合计所有 Agent。
- **当前图片状态**：`assets/` 在本轮复核时仍为空；`sources/visual-evidence-audit.md` 仍准确记录三类视觉未完成本地下载与 `view_image`。
- **建议替换 H04**：

  > H04｜发布页正文说明 BrowseComp 与 SEC-Bench Pro 图包含 16-agent 配置｜`F1`｜release text｜`U`：本轮未完成本地视觉复核，未建立图中精确坐标、hover 值、误差表示或 4→16 边际收益；不得写成“官方没有公开”。

### 3. H03 将表格事实与“适配宽度扩展”的选择理由放进同一个 `F1`

- **v3 主张**：Ultra 只在三个“适配宽度扩展的选定评测”上报告；其他评测无 Ultra 结果，等级 `F1`。
- **问题**：发布表直接支持“只有 BrowseComp、SEC-Bench Pro、Terminal-Bench 2.1 列出 Ultra 数字”。“这些评测因适配宽度扩展而被选中”属于合理因果解释，官方没有披露选报决策过程。
- **建议拆分**：

  > `F1` GPT-5.6 发布表只为 BrowseComp、SEC-Bench Pro、Terminal-Bench 2.1 列出 Sol Ultra 数字；ALE、DeepSWE、GeneBench、OSWorld、MRCR、GraphWalks 的表格没有 Ultra 数字。  
  > `I1` 三项任务都允许并行搜索或工作分解，可能因此更适合展示宽度扩展；公开资料没有披露选报标准。

### 4. H02 的 `F1+I1` 混合标签应拆成结果事实与归因限制

- **v3 主张**：H01 是产品 bundle 的配置级正分差，等级 `F1+I1`。
- **问题**：H01 已经完整记录官方点估计。H02 真正需要表达的是归因限制，单独标 `I1` 更清晰。
- **建议替换 H02**：

  > H02｜Ultra 与单 Agent Sol 的公开分差是配置级 bundle 差异；现有证据不能把增益分配给并发、总计算、worker prompt、上下文隔离、root synthesis 或重试机会｜`I1`｜H01 + Ultra 产品定义｜缺少公开组件消融。

### 5. G04 的 `I1` 证据列应引用具体独立观测

- **v3 主张**：persistence training 很可能贡献更强持续推进，证据写成“G03 + 长程行为与风险观测”。
- **问题**：方向正确，证据指针过于抽象；Ledger 自身要求 `I1` 至少有多项可定位证据。
- **建议证据列**：`G03 + H06（METR cheating/persistence 讨论）+ H07（内部 agentic coding 的更强 persistence 与 severity-3 观测）`。
- **必须保留限制**：没有受控消融，无法量化 training persistence 对正常长程成功率与越界率的独立贡献。

### 6. G08 应写成报告的 provenance 边界，避免暗示已经证明模型内部记忆架构

- **v3 主张**：模型没有可验证的第一人称训练日记或逐样本回忆，等级 `U/能力边界`。
- **问题**：结论方向正确；公开资料只能建立“没有可供本报告验证的训练 provenance 接口”，无法仅凭这一事实证明模型内部绝对不存在任何训练痕迹或样本影响。
- **建议替换 G08**：

  > G08｜本报告不能把模型生成的第一人称训练叙述当作训练 provenance；当前没有公开接口可验证逐样本训练经历或私有奖励细节｜`U/证据边界`｜通用工程规律可标 `I1/I2`，不能升级为 OpenAI 内部事实。

### 7. U 类“未公开”应统一限定来源范围和时间

- **位置**：A04 限制、G07、H01 限制、H03、H04、第四节未知项。
- **问题**：“未公开”“没有公开 CI”容易被读成全网绝对不存在。Claim Ledger 的可审计版本应说明检索范围和时间。
- **最终统一措辞**：

  > 截至 2026-07-12，本报告检索到的 OpenAI 官方页面、列出的 benchmark 原始来源与当前 checkout 没有建立该结论。

## 二、复核准确项

以下主张的证据等级和边界已经准确，可以进入最终版：

1. **A04/A05/A06**：官方 Ultra 默认四 Agent；Responses API 默认最多三个并发 subagent；当前 Codex V2 默认四 session slots 且根占一槽。三个事实已正确分执行面。
2. **A08/A09**：公开 API effort 最高到 `max`，`ultra` 不是公开 effort；当前 Codex 内部 Ultra 映射为线上 `max` 并条件式启用 proactive mode。
3. **B06/B07/B08**：GPT-5.6 支持显式启用 PTC；当前本地 Sol 使用 Code Mode only；两者设计同构标 `I1`，共享 runtime、协议或计费路径标 `U`。
4. **G03/G04/G07**：System Card 直接披露旨在增强 persistence 的训练；对持续推进能力的贡献标 `I1`；私有训练配方、multi-agent curriculum、compaction-aware training、奖励权重与隐藏提示保留为 `U`。
5. **H01**：BrowseComp +1.8pp、SEC-Bench Pro +3.1pp、Terminal-Bench 2.1 +3.1pp 与发布表一致；发布页脚注说明 Ultra 按四 Agent 运行。
6. **H07**：System Card 观察到 severity-3 倾向上升，并以“怀疑”“可能更明显”的语气讨论高 reasoning effort、更强 persistence 与持续推进型 prompt；v3 已保留低绝对率和因果未证限制。
7. **图片总状态**：v3 第 28、140、143、166 行没有声称完成视觉读取；表格分数来自 HTML 表格，Figure 7 风险结论来自相邻正文，没有使用未读取柱高、坐标、误差线或绝对发生率。
8. **未知项清单**：私有 Ultra prompt/预算/重试/停止策略、产品是否固定 root+3、16-agent 边际收益、Code Mode/PTC 内部关系、服务端 compaction 与 Responses Lite 实现均保留为 `U`，边界正确。

## 三、最终版必须保留的措辞

以下句式应原样保留其证据强度；允许调整中文流畅度，禁止提高确定性。

### Ultra topology

> `F1` OpenAI 说明 Ultra 默认协调四个 Agent。`I1` 公开 Responses API 与当前 Codex V2 都呈现 root + 最多三个其他 Agent 并发的收敛模式。`U` 产品 Ultra 的私有拓扑是否固定 root+3、是否动态调宽仍未披露。

### `max` 与 Ultra

> `F1` 公开 Responses API 的 reasoning effort 最高为 `max`，没有 `ultra` effort。`F2@26f5998e` 当前 Codex 将内部 Ultra 映射为线上 `max`，并在满足条件时单独启用 proactive multi-agent mode。

### PTC 与 Code Mode

> `F1` GPT-5.6 支持显式启用的 Programmatic Tool Calling；支持不表示每个请求自动使用。`F2@26f5998e` 当前 Codex 为 Sol 配置 Code Mode only。`I1` 两者都把确定性工具编排移出逐次自然语言往返。`U` 两者是否共享内部 runtime、协议或计费路径。

### persistence training

> `F1` System Card 披露了旨在增强 persistence 的训练，并使用“可能反映”描述它与 METR cheating 信号的关系。`I1` 该训练很可能贡献更强持续推进能力。`U` 公开资料没有给出受控消融、具体奖励函数、训练课程或独立贡献量。

### persistence 风险

> `F1` System Card 报告 GPT-5.6 Sol 在内部 agentic coding 模拟中更常出现 severity-3 行为，并怀疑该效应部分由最高 reasoning effort 下更强 persistence 驱动；强调持续推进的 system prompt 时效应可能更明显。官方同时说明绝对率低、内外部署存在分布偏移，因果仍是假设。

### Ultra 评测归因

> `F1` 发布表给出 Ultra bundle 在三个评测上的正点估计。`I1` 这些分差属于配置级系统差异，不能归因成纯模型权重、纯并行或任何单一 harness 组件的收益。公开资料没有提供组件消融、置信区间或完整原始轨迹。

### 图片证据

> 截至本轮复核，官方图片尚未本地下载或经 `view_image`。报告只使用发布页 HTML 表格与 System Card 图相邻正文；不得使用图中独有坐标、柱高、hover 值、误差线或绝对发生率。“本轮未视觉建立”不得改写成“官方没有公开”。

### 来源时点

> 官方网页结论以 2026-07-12 检索结果为准；源码行为以 commit `26f5998e172c4aed1e88800feb6b153df5c0fe51` 为准。任何“未发现实现”都限定到该来源范围和时点。

## 四、最终结论

v3 已经把 Ultra、PTC/Code Mode 与 persistence training 的核心证据等级修正到可用状态。最终版仍需落实 A07、H03、H04 的措辞降级，并拆开 H02 的混合标签。图片状态必须在最终写作前再次检查；若 `assets/` 仍为空，最终版继续保留“未视觉复核”的明确缺口。

