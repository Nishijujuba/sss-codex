# `draft-v1-source-synthesis.md` 官方事实与推断边界独立审查

> 审查对象：`../draft-v1-source-synthesis.md`  
> 审查时间：2026-07-12（Asia/Shanghai）  
> 审查范围：官方资料事实、数字、命名、执行面映射、时间/版本漂移、视觉证据边界、`F1/F2/F3/I1/I2/U` 标签  
> 审查纪律：本文件只给 findings 与建议改写；v1 原稿保持不变。

## 一、结论先行

v1 **未发现 P0 级问题**。模型规格、Ultra 三项分数、长上下文分数、System Card 风险描述、PostTrainBench Lite 与 MLE-Bench Revised 的主要数字均与当前官方页面一致。

需要在 v2 修正的核心问题有五类：

1. 产品 Ultra、Responses API Multi-agent 与当前本地 Codex V2 的拓扑被合并成一个直接事实；“根 Agent + 三个子 Agent”应标为跨执行面的 `I1`。
2. “Ultra reasoning effort”被写成“UI/API 侧”概念；公开 Responses API 的 reasoning effort 最高到 `max`，`ultra` 是 Codex 产品/内部枚举与编排语义。
3. “支持 persisted reasoning / PTC”与“当前 Codex 自动启用某条实现路径”没有完全分开；本地 Code Mode 与公开 Programmatic Tool Calling 也需要分层说明。
4. 多个段落把 `F1/F2` 事实与 `I1` 因果推断放在同一标签下；`F3` 与 `U` 在正文中几乎未实际使用。
5. 视觉证据当前没有完成本地下载与 `view_image`。v1 使用的 Ultra 分数来自发布页 HTML 结果表，风险描述来自 System Card 正文，暂未发现把图中独有数据写成事实的情况；v2 应把这项来源边界写进表注。

## 二、P0

无。

## 三、P1 findings

### P1-1：Ultra 的“根 + 三子”拓扑被从跨源推断提升成产品直接事实

- **位置**：v1 第 15、32、51、54–56 行。
- **问题**：GPT-5.6 发布页直接声明 Ultra 默认协调四个 Agent。Responses Multi-agent 文档直接声明根 Agent 可协调子 Agent，`max_concurrent_subagents` 默认值为 3，并为根与各子 Agent 保留独立上下文和独立自动压缩。当前 checkout 的 Codex V2 又直接配置四个 session concurrency slot，根线程占一个。三项证据高度一致，公开资料仍未直接声明 Codex 产品 Ultra 的默认四 Agent 必然固定实现成“一个根 + 三个子 Agent”，也未声明产品 Ultra 与 Responses API beta 的全部调度器配置相同。
- **标签判断**：
  - “Ultra 默认四 Agent”是 `F1`。
  - “Responses API 默认最多三个并发子 Agent”是 `F1`。
  - “当前本地 Codex V2 默认四槽、根占一槽”是 `F2`。
  - “产品 Ultra 默认拓扑等于一个根 + 三个子 Agent”是 `I1`。
- **官方依据**：[GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)、[Responses Multi-agent](https://developers.openai.com/api/docs/guides/responses-multi-agent)。
- **建议改写**：

  > `F1` 发布页说明 Ultra 默认协调四个 Agent。`F1` Responses API Multi-agent 采用根 Agent 与子 Agent 拓扑，默认最多并发三个子 Agent。`F2` 当前 Codex V2 默认提供四个 session slot，根线程占一个。`I1` 这些证据共同支持“根 + 三子”是当前 Ultra 行为的强解释；公开资料没有确认各执行面共享完全相同的调度实现。

### P1-2：“UI/API 侧 Ultra reasoning effort”会误导为公开 API 参数

- **位置**：v1 第 31–32、40 行。
- **问题**：公开 Responses API 的 GPT-5.6 reasoning effort 为 `none`、`low`、`medium`、`high`、`xhigh`、`max`；`ultra` 不是公开 API reasoning effort。当前 Codex 源码确实存在 `ReasoningEffort::Ultra`，发送请求时把它映射成线上的 `max`，并另行注入 proactive multi-agent mode。这是 Codex 产品/客户端内部映射。
- **标签判断**：公开 API effort 集合是 `F1`；当前源码映射是 `F2`；“Ultra 是最高推理预算与主动编排的复合产品模式”是由两项源码行为直接支撑的本地实现结论，可标 `F2` 并限定 checkout。
- **官方依据**：[Using GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model)。
- **建议改写**：

  > `F2` 当前 Codex 内部的 `ReasoningEffort::Ultra` 在请求线上模型时降解为公开 effort `max`，同时通过独立 developer instruction 打开 proactive multi-agent mode。公开 Responses API 不接受 `ultra` 作为 reasoning effort。

### P1-3：支持 PTC、Codex Code Mode 与实际自动使用被压成同一层

- **位置**：v1 第 16、23、38、127–131 行。
- **问题**：官方资料证明 GPT-5.6 **支持** Programmatic Tool Calling；请求只有显式添加 PTC 工具并配置 eligible tools 后才会使用该能力。当前 Codex 模型目录的 `tool_mode: code_mode_only` 是 `F2`，对应本地 Code Mode/嵌套工具执行面。两者共享“用代码编排工具并缩减中间结果”的设计思想，公开资料没有证明它们是同一套 runtime、协议或计费路径。
- **影响**：当前写法容易让读者推断“每个 Sol/Ultra 请求都会自动使用公开 API PTC”，也容易把本地 V8 isolate 当成公开 PTC hosted runtime 的源码实现。
- **标签判断**：GPT-5.6 支持 PTC 是 `F1`；当前本地目录强制 Code Mode 是 `F2`；两者架构同构是 `I1`；是否共享内部实现是 `U`。
- **官方依据**：[Using GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model)、[GPT-5.6 prompt guidance](https://developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6)。
- **建议改写**：

  > `F1` GPT-5.6 支持显式启用的 Programmatic Tool Calling。`F2` 当前 Codex checkout 为 Sol 选择 `code_mode_only`，由本地 Code Mode 在隔离 V8 环境中编排嵌套工具。`I1` 两条路径都把确定性工具编排移出逐次自然语言往返；`U` 公开资料没有确认两者共享同一内部 runtime。

### P1-4：persistence 训练事实与对用户体验的因果归因共用 `F1`

- **位置**：v1 第 23、150–154 行。
- **问题**：System Card 的直接措辞是：METR 检测到的行为“可能反映”更好的指令遵循与旨在增强 persistence 的训练。它直接证明 OpenAI 披露了“旨在增强 persistence 的训练”；它没有直接证明该训练对用户观察到的三项行为分别贡献多少。v1 第 152 行的“很可能是长程行为改善的直接来源之一”属于因果推断。
- **标签判断**：System Card 原始披露是 `F1`；该训练是当前长程体验改善来源之一是 `I1`；具体训练目标、奖励权重与数据课程仍是 `U`。
- **官方依据**：[GPT-5.6 System Card](https://deploymentsafety.openai.com/gpt-5-6)。
- **建议改写**：

  > `F1` System Card 披露了旨在增强 persistence 的训练，并用“可能反映”描述它与 METR cheating 信号的关系。`I1` 该训练很可能贡献了更强持续推进能力。`U` 公开资料无法量化它对子 Agent 规划、状态外化或中断恢复的独立贡献。

### P1-5：长上下文分数缺少比较对象，容易被读成 Ultra 消融

- **位置**：v1 第 193 行。
- **问题**：91.5/81.5、77.1/45.4、73.8/74.0 的比较对象是 **GPT-5.6 Sol 与 GPT-5.5**，不是 Sol Ultra 与单 Agent Sol。该段位于 Ultra 评测表之后，省略列名会造成错误归因。
- **标签判断**：发布页表格数字是 `F1`；由数字推断“并非所有超长区间均领先”也是直接表格比较，可保持 `F1`，同时限定模型和区间。
- **官方依据**：[GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)。
- **建议改写**：

  > `F1` 单模型长上下文结果中，GPT-5.6 Sol 对 GPT-5.5：MRCR v2 8-needle 256K–512K 为 91.5% 对 81.5%，GraphWalks BFS 1M 为 77.1 对 45.4；MRCR 512K–1M 为 73.8% 对 74.0%。这些数字没有提供 Ultra 消融。

### P1-6：证据标签只覆盖少数段落，事实与推断仍在无标签区混合

- **位置**：v1 全文，集中在第 11–23、46–52、89–144、193–203、207–263 行。
- **问题**：文件定义了六级证据体系，正文实际主要使用 `F1`、`F2`、单个 `I1` 与一组 `I2`。`F3` 和 `U` 没有形成可定位条目。以下高影响表述缺少标签或在同段混合：
  - 第 13–19 行的七层因果模型；
  - 第 48 行“Sol 的语义分解质量提高”；
  - 第 125 行 WebSocket 对缓存、传输和连续性的综合收益；
  - 第 144 行 Sol 能力会放大 Goal 工程价值；
  - 第 195–203 行 benchmark 含义与成本结论；
  - 第 209–250 行源码事实与“尚未证明”的缺口；
  - 第 254–263 行设计原则。
- **影响**：读者无法仅凭标签区分“源码直接行为”“跨源因果解释”“工程建议”和“公开资料缺失”。
- **建议改写**：为 v2 增加 claim ledger，至少包含 `claim_id / statement / tag / source / surface / as_of / limitation`。正文每个因果段落只使用一个主要证据等级；混合段落拆开。第九节的 mailbox、后台进程、hydrate、反向重建和 `fsync` 缺口应标 `U` 或“本轮源码未发现”，避免把搜索缺失提升成全局不存在。

### P1-7：SWE-Bench Pro 审计结论缺少直接来源

- **位置**：v1 第 201 行、依据目录。
- **问题**：该结论来自 OpenAI 2026-07-08 的独立审计文章。v1 依据目录没有列出该页面，正文也没有 inline citation。该材料对解释 benchmark 有效性非常关键，应具备可追溯来源。
- **官方依据**：[Separating signal from noise in coding evaluations](https://openai.com/index/separating-signal-from-noise-coding-evaluations/)。
- **建议改写**：

  > `F1` OpenAI 对 SWE-Bench Pro 的审计估计约 30% 任务存在破损，并列出过严测试、规格不完整、覆盖不足与提示误导等缺陷。该比例是该次审计的估计，不能自动外推到其他 benchmark。

## 四、P2 findings

### P2-1：`reasoning.context` 取值说明不完整

- **位置**：v1 第 117 行。
- **问题**：当前官方指南还定义 `auto`，省略字段时也使用模型默认。`current_turn` 与 `all_turns` 是两种显式策略，现有写法容易被当成完整枚举。
- **建议改写**：

  > `F1` `reasoning.context` 支持 `auto`、`current_turn`、`all_turns`；省略字段时采用模型默认。`all_turns` 只有在目标、假设与优先级稳定时才适合持续使用。

### P2-2：`CompactedItem.replacement_history` 被写成所有 compaction 路径的统一形态

- **位置**：v1 第 70、89–93、211–213 行。
- **问题**：当前本地模型生成的摘要压缩可以写入可读 `replacement_history`；服务端 compaction 使用不透明加密 item；TokenBudget 新窗口路径还可能持久化空消息且 `replacement_history` 为 `null`。v1 的通用表述会掩盖路径差异。
- **建议改写**：

  > `F2` 本地模型摘要压缩路径可把 `replacement_history` 持久化进 `CompactedItem`。`F1` Responses 服务端 compaction 生成不透明压缩 item。`F2` TokenBudget 新窗口路径可使用空 compaction marker 与新的 WorldState/TurnContext baseline。恢复算法应按实际 compaction variant 解释。

### P2-3：System Card 比较值具有快照漂移，v1 只记录源码基线

- **位置**：v1 第 3–6、150–154、193–201 行。
- **问题**：System Card 明确说明已发布旧模型的比较值使用较新的 snapshots，可能与各模型发布时数值略有差异；评测政策、grader 和数据也会演化。v1 记录了源码 commit，没有为网页材料记录抓取日期或页面版本。
- **建议改写**：在 v2 的来源表增加 `accessed_at=2026-07-12`，并注明“官方网页为可变来源；历史 draft 保存的是该日期看到的值”。引用旧模型对照值时补充“current comparison snapshot”。

### P2-4：视觉证据边界处理正确，仍需要显式表注避免后续误读

- **位置**：v1 第 54、154、185–193、272、279 行。
- **核查结果**：`sources/visual-evidence-audit.md` 明确记载三类图像尚未完成本地下载和 `view_image`。v1 的 90.4/92.2、71.2/74.3、88.8/91.9 来自发布页 HTML 汇总表；System Card 风险叙述来自 Figure 7 相邻正文；MRCR 与 GraphWalks 也来自页面表格。未发现引用未读取坐标、柱高、误差线或 latency 点位。
- **建议改写**：在第 7.1 表下注明“分数来自官方 HTML 结果表；多代理 score-latency 图尚未视觉复核，未使用图中独有 latency 坐标”。Figure 7 段落注明“使用相邻正文定性结论，不含图中绝对发生率”。

### P2-5：本地 V2 四槽与旧版/另一执行面默认值需要显式版本分层

- **位置**：v1 第 56 行。
- **问题**：当前 checkout 的 V2 默认 `max_concurrent_threads_per_session=4`，根占一槽；Responses API beta 的默认 `max_concurrent_subagents=3`；旧版/legacy Codex 资料还可能出现 `agents.max_threads=6`。V2 启用时源码会拒绝用户设置 legacy `agents.max_threads`。v1 当前数字正确，缺少这组版本冲突提示。
- **建议改写**：

  > `F2@26f5998e` 当前 Codex V2 默认四个 session slots，含根线程；`F1@2026-07-12` Responses Multi-agent 默认最多三个并发子 Agent；旧 `agents.max_threads` 属于 legacy 配置，不能用于推导 V2 当前默认值。

### P2-6：WebSocket 与 Responses Lite 的收益句包含未标注因果推断

- **位置**：v1 第 119、123–125 行。
- **问题**：请求复用条件、sticky token、prefix-extension 检查是 `F2`。稳定前缀与缓存建议是 `F1`。它们“同时改善缓存命中、网络传输和状态连续性”的具体贡献没有本稿消融，应标 `I1/I2`。第 119 行“关闭普通 parallel tool calls，因为并发主要由 Code Mode/PTC 与 V2 collaboration 承担”也包含解释性因果；源码直接证明开关值，未必直接证明产品设计动机。
- **建议改写**：将“设置/检查条件”保留为 `F2`；把收益改成“`I1` 这些设计预计减少重复请求状态与错误复用，具体 token、延迟和质量收益需消融”。

### P2-7：PostTrainBench Lite 的“五小时后训练”措辞存在中文歧义

- **位置**：v1 第 195 行。
- **问题**：“五小时后训练”可能被理解为五小时之后才开始训练。官方事实是每项任务给一张 H100 和五小时总预算，Agent 在预算内设计并执行 post-training recipe。
- **建议改写**：使用“单张 H100、五小时预算内的 post-training recipe 设计与执行”。

### P2-8：多 Agent 成本与协调复杂度结论应标为推断并拆分官方量度

- **位置**：v1 第 202 行。
- **问题**：官方发布页直接说明 Ultra 使用更多 token，输出 token 与 API 成本统计包含全部 Agent，延迟从根 Agent 推导。协调复杂度上升是合理工程推断；“总成本通常上升”需要结合并发数、任务成功率、缓存和定价测量。
- **建议改写**：

  > `F1` Ultra 以更高 token 使用换取更强结果与更短结果时间，官方统计的 token 与 API 成本包含所有 Agent。`I1` 并发会增加协调与共享状态风险。总成本方向应按任务成功率与实际 usage 评估。

### P2-9：发布页自身存在 Agents' Last Exam 数字差异，v1 后续扩展时需要防误用

- **位置**：v1 当前未引用该分数；属于下一版防错项。
- **问题**：GPT-5.6 发布页正文曾给出 53.6，页面末尾结果表给出 52.7%。当前 v1 没有引用 Agents' Last Exam 数字，因此没有形成现存错误。v2 若加入该 benchmark，应并列记录页面内冲突或选择有版本说明的原始 benchmark 来源。
- **建议改写**：把该项标 `U/冲突`，避免任选一个数字写成无争议事实。

## 五、已核实为正确的关键事实

以下项目无需因本轮审查而降级：

- `gpt-5.6` 当前 alias 路由到 `gpt-5.6-sol`；v1 已说明 alias 可能随时间变化。
- Sol 当前官方规格为 1,050,000 context、922,000 max input、128,000 max output。
- 当前本地模型目录为 Sol 配置 372,000 context；v1 已正确把 372K 与公开 API 1.05M 作为执行面差异，未推测原因。
- Ultra 三项汇总分数正确：BrowseComp 90.4% → 92.2%，SEC-Bench Pro 71.2% → 74.3%，Terminal-Bench 2.1 88.8% → 91.9%。
- 长上下文表数字正确，需按 P1-5 补全比较列名。
- PostTrainBench Lite 的一张 H100、五小时预算、12 个组合与狭窄策略风险；MLE-Bench Revised 的 72 个问题与最多三次 leaderboard submission，均与 System Card 相符。
- System Card 对 severity-3 越界、最高 effort、持续推进型提示、低绝对发生率与内外分布偏移的描述，v1 保持了必要限定。
- 精简 system prompt 的 10–15% 分数、41–66% token、33–67% 成本范围及“仅属方向性内部样本”的限定，与当前 GPT-5.6 官方指南一致。

## 六、建议的 v2 标签模板

建议将高影响段落统一成以下最小格式：

```markdown
`F1@2026-07-12` 官方公开事实，并给出直接 URL。

`F2@26f5998e` 当前 checkout 的源码或测试事实，并给出文件与行号。

`F3` benchmark 原始论文、任务规范或独立审计结论。

`I1` 由上述事实共同支持的强解释，同时列出尚无消融量化的部分。

`I2` 可实施、可证伪的工程假设，并给出建议实验。

`U` 当前公开资料或本轮源码审计没有建立的结论；使用“未发现证明”，避免写成“确定不存在”。
```

该模板能够把“模型能力”“公开 API 能力”“Codex 当前实现”“产品 Ultra 行为”和“工程复现建议”保持在五条可审计轨道上。

