# final-v1 官方事实与证据边界独立复核

> 复核对象：`final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md`  
> 复核日期：2026-07-12（Asia/Shanghai）  
> 复核范围：官方产品、模型、训练与评测事实；事实／推断／假设／未知分层；因果措辞；视觉证据；13 项 No-Go  
> 源码基线：报告声明的 commit `26f5998e`

## 一、结论

**判定：有条件通过。** final-v1 的主体证据链可靠，13 项 No-Go 全部通过，未发现 P0。正式交付前仍需完成三项 P1：修正一处执行面与内部实现混同的断言，明确 BrowseComp 专项训练的历史主体，并补齐或移除三处失效的本地视觉引用。

| 等级 | 数量 | 交付含义 |
|---|---:|---|
| P0 | 0 | 没有会推翻主结论的事实错误 |
| P1 | 3 | 正式交付前应修正或完成 |
| P2 | 5 | 建议修正，以提高认识论精度和名称一致性 |
| No-Go | 13/13 PASS | 当前正文没有触发禁止交付项 |

缺失的两张 PNG 与 `visual-evidence-audit-v2.md` 分类为**交付完整性问题**，不计入事实错误。正文没有依赖未读取图片中的独有数值。

## 二、已通过的高风险事实

以下高风险事实经过官方材料、现有证据 ledger 与当前源码边界交叉核对，结论可保留：

1. Ultra 是产品／Harness setting，默认协调四个 Agent；公开 API 没有名为 `ultra` 的 reasoning effort，当前公开最高 effort 是 `max`。
2. Responses Multi-agent 的公开语义包含 root/subagent 独立上下文、消息、并发与独立 compaction；当前本地 Codex V2 默认四个 session slot，根占一个。两者的内部实现共享关系仍属未知。
3. GPT-5.6 Sol 的公开 API context、最大输入与最大输出分别为 1,050,000、922,000、128,000 tokens；当前本地 Codex 模型目录中的 372,000 context 是另一执行面的配置事实。
4. `reasoning.context`、persisted reasoning、WebSocket 增量请求、Programmatic Tool Calling 与本地 Code Mode 的边界总体准确。报告已将 PTC 与 Code Mode 的共同内部实现标为 `U`。
5. Ultra 三项点估计及差值准确：BrowseComp `90.4% → 92.2%`，SEC-Bench Pro `71.2% → 74.3%`，Terminal-Bench 2.1 `88.8% → 91.9%`。报告没有声称统计显著，也没有虚构 16-agent 精确坐标。
6. GPT-5.6 System Card 的数据类别、reasoning RL、persistence training、overwrite avoidance、confirmation policy 与内部 severity-3 风险措辞总体准确。报告保留了官方的可能性措辞和低绝对率边界。
7. codex-1、o3/o4-mini、Deep Research 与 process supervision 被置于历史训练方向，报告明确说明这些材料无法直接证明 Sol 的训练配方。
8. 五条 token／预算路径、Goal prompt contract 与 runtime authority、PlanUpdate transient 性质、rollout／compaction／WorldState 的持久化边界保持分离。
9. MRCR 与 GraphWalks 被限定为长输入检索／图推理证据，没有被当作 durability、跨重启或 Goal 恢复证据。

主要官方依据：

- [GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)
- [GPT-5.6 Sol 模型页](https://developers.openai.com/api/docs/models/gpt-5.6-sol)
- [GPT-5.6 模型指南](https://developers.openai.com/api/docs/guides/latest-model)
- [GPT-5.6 System Card](https://deploymentsafety.openai.com/gpt-5-6)
- [Responses Multi-agent](https://developers.openai.com/api/docs/guides/responses-multi-agent)
- [Programmatic Tool Calling](https://developers.openai.com/api/docs/guides/tools-programmatic-tool-calling)
- [BrowseComp 论文](https://arxiv.org/abs/2504.12516)

## 三、P0

无。

## 四、P1：正式交付前应处理

### P1-1：执行面差异被写成内部实现差异

**位置：** 第 66 行，名称与执行面表格。  
**当前措辞：** “与本地 Codex V2 的实现不同”。

公开资料能够确认 Responses Multi-agent 与本地 Codex V2 属于不同执行面，也能够分别确认两侧的外部行为。公开资料和当前源码没有建立托管侧内部实现，因此当前措辞超过证据上限，并与第 142 行的 `U` 边界产生冲突。

**精确替换：**

```markdown
| Responses Multi-agent beta | 托管 API 编排 | root/subagent 独立上下文、消息、并发与独立 compaction | 属于不同执行面；是否与本地 Codex V2 共享内部实现属于 `U` |
```

### P1-2：BrowseComp 专项训练的主体不够明确

**位置：** 第 348 行。  
**当前措辞：** “原始研究披露过 BrowseComp-like 专项训练”。

原始 BrowseComp 论文披露的是**当时的 Deep Research 系统**接受过面向 BrowseComp 类任务的专项训练。当前句子省略训练主体，快速阅读时可能被误解为 GPT-5.6 Sol 的直接训练披露，接近 No-Go 8 的边界。GPT-5.6 是否接触题目、答案或生成模板仍为未知。该段还应直接链接 BrowseComp 一手来源。

**精确替换：**

```markdown
**BrowseComp** 是 1,266 个逆向构造的短答案网页检索题，测持续搜索、查询重构和证据组合；公开静态、接近饱和。[OpenAI BrowseComp 介绍](https://openai.com/index/browsecomp/)、[BrowseComp 论文](https://arxiv.org/abs/2504.12516) `F3` 原始论文披露，当时的 Deep Research 系统接受过面向 BrowseComp 类任务的专项训练；`U` 当前公开资料没有建立 GPT-5.6 是否接触过题目、答案或任务生成模板。人工 reference agreement 为 86.4%。
```

### P1-3：三个本地视觉引用缺失

**位置：** 第 393、395、399、579 行。  
**缺失目标：**

- `assets/gpt-5-6-system-card-figure-7-internaldep.png`
- `assets/deployment-simulation-figure-1-production-resampling.png`
- `sources/visual-evidence-audit-v2.md`

当前 `assets/` 中没有两张图片，视觉复核 v2 也不存在。该问题造成图片与审计链接失效，属于交付完整性问题。正文关于 Figure 7 的结论来自官方相邻正文，并明确拒绝采用未复核图内数值；Deployment Simulation 的 `42%` 来自官方正文。因此，本项不计入事实错误，也不触发 No-Go 12。

**根任务应完成的首选修复：**

1. 从对应官方页面或官方 PDF 提取两张原图，按上述路径保存。
2. 使用 `view_image` 实际读取两张本地图片。
3. 新增 `sources/visual-evidence-audit-v2.md`，记录来源 URL／页码或图号、本地路径、可见元素、相邻正文、图文一致性、可引用信息与继续保持未知的信息。
4. 检查 final-v1 的全部相对链接，确认三个目标均可解析。

若官方图无法取得，交付前应移除两处失效图片嵌入及两处 v2 链接，并保留基于官方相邻正文的文字结论。

## 五、P2：建议提高认识论精度

### P2-1：开篇复合因果结论缺少 `I1` 标签

**位置：** 第 12 行。

七层组件分别具有 F1/F2 证据，公开资料没有组件消融可以证明完整因果分配。“优势来自”应明确标为最佳解释。

**精确替换：**

```markdown
`I1` 现有证据支持的最合理解释是：GPT-5.6 Sol Ultra 的长程表现由一个复合系统共同产生，包括 Sol 的推理、工具使用、错误恢复与 persistence，`max` 级推理时计算，Ultra 的四 Agent bundle，persisted reasoning 与程序化工具编排，Codex 的 rollout/compaction/Goal/Agent graph 持久运行时，仓库 Artifact，以及验证与安全闭环。`F1/F2` 能分别确认这些组件的公开能力或当前实现；公开资料没有组件消融可以量化各自因果贡献。当前公开证据不支持“存在一个 Sol 专属长记忆模块”或“到任何 token 上限都会自动写一个状态 Markdown”的单一机制解释。
```

### P2-2：意图与 token 改进的长程收益仍是推断

**位置：** 第 122 行。

“更少局部误解、更少无效工具往返、更准确判断”是合理的系统推断，官方材料没有隔离这些长程结果。

**精确替换：**

```markdown
`I1` 这些改进可能减少局部误解和无效工具往返，并改善完成层级判断与 checkpoint summary；公开资料没有隔离这些长程收益，具体贡献仍需固定 Harness 的对照实验。
```

### P2-3：cache miss、上下文污染与策略泛化被合并为一个已证事实

**位置：** 第 281 行。

列出的机制分别作用于请求连续性、状态差分、上下文体积与工具暴露面。源码可以证明机制存在，无法直接证明它们都减少 cache miss，也无法直接证明策略泛化改善。

**精确替换：**

```markdown
`F2` 当前实现包含请求属性严格比较、exact prefix extension、WorldState diff、sparse phase update、tool output truncation 和 deferred tool surface。`I1` 这些机制可能减少可避免的 prefix churn 与上下文污染，并帮助工具策略在稳定接口上泛化；cache、token 和泛化增益仍需消融测量。
```

### P2-4：最终结论再次压缩了 PTC／Code Mode 与整体因果边界

**位置：** 第 500、510 行。

PTC 的官方材料支持减少 model round trips 与 token；本地 Code Mode 的源码支持程序化编排形态。两者是否共享内部实现仍为 `U`，完整七层系统的独立贡献也未被消融。“每一步的语义质量”覆盖范围过宽。

**第 500 行精确替换：**

```markdown
`I1` Sol Ultra 做好长程任务的最合理系统解释由七层共同构成：模型更能理解并持续执行目标；`max` 分配更多推理时计算；Ultra 扩大并行搜索宽度；persisted reasoning 与 WebSocket 提供推理和请求连续性；Code Mode／PTC 按各自公开材料或源码设计减少逐次自然语言工具往返；Codex 用 rollout、compaction、WorldState、Goal、Agent graph 和 exec runtime 提供恢复骨架；仓库 Artifact 保存跨线程事实；验证与权限闭环约束完成与越界。公开资料没有隔离各层的质量、延迟或 token 贡献，Code Mode 与 PTC 是否共享内部实现属于 `U`。
```

**第 510 行精确替换：**

```markdown
长程 Agent 的工程本质是：**把一次模型调用变成可恢复、可验证、可审计、可停止的状态机。** `I1` 公开评测与产品材料支持 Sol 提高多类代理步骤和最终结果的语义质量；“每一步都提高”以及各层贡献比例仍缺少组件级证据。Codex Harness 决定这些能力能否跨数小时、多 Agent、窗口切换和故障持续兑现。
```

### P2-5：评测名称大小写与官方发布页不一致

**位置：** 第 20、157、162、350、571 行。

OpenAI GPT-5.6 发布页使用 `SEC-Bench Pro`。建议将全文 `SEC-bench Pro` 统一为 `SEC-Bench Pro`。该项不改变任何数值或结论。

## 六、13 项 No-Go 独立验收

| # | No-Go | 结果 | 当前正文证据与判断 |
|---:|---|---|---|
| 1 | 把 Ultra 写成独立模型或公开 reasoning effort | PASS | 第 63–69 行将 Ultra 定义为产品／Harness setting，并明确公开最高 effort 为 `max` |
| 2 | 把 root+三子写成产品私有拓扑直接事实 | PASS | 第 65–67、166–174 行分别陈述官方“四 Agent”与当前本地 V2“根占一 slot”；没有把本地拓扑冒充线上私有实现 |
| 3 | 把 Ultra 点估计写成已证明统计显著 | PASS | 第 154–162 行明确缺少 seed、置信区间和 paired test |
| 4 | 把 Ultra bundle 增益归因给单一机制 | PASS | 第 20、160 行将结果限定为配置级 bundle 分差，组件贡献保持未知 |
| 5 | 给出未公开的 16-agent 精确数字 | PASS | 只提出未来 1/4/16-agent 消融设计，没有声称未公开坐标 |
| 6 | 把 MRCR／GraphWalks 当成 durability 或跨重启证据 | PASS | 第 73–86、372–387 行明确否定该外推 |
| 7 | 从 benchmark 分数推出 Goal／rollout／budget 持久化因果 | PASS | 第 249–259、385–387 行将源码状态事实与模型／Ultra 因果分开 |
| 8 | 把历史 Codex、o3/o4、Deep Research 训练直接归因给 Sol | PASS | 第 307–317 行明确归类为历史方向，Sol 复用范围为 `U`；P1-2 用于消除 BrowseComp 段落的主体歧义 |
| 9 | 声称模型能回忆私有训练样本或专项训练经历 | PASS | 第 330–342 行拒绝第一人称训练 provenance，并列出训练配方未知项 |
| 10 | 混淆五条 token／预算路径 | PASS | 第 249–259 行给出独立权威状态、持久结果与达限语义 |
| 11 | 忽略 Goal prompt contract 与 runtime enforcement 的区别 | PASS | 第 224–235 行分别列出 model contract 与 runtime authority，并说明 handler 未验证 blocker 次数 |
| 12 | 引用尚未视觉复核的图内独有信息 | PASS | 第 395 行拒绝采用未复核 Figure 7 图内数值；第 401 行的 42% 来自官方相邻正文。缺失图片另列 P1-3 |
| 13 | 覆盖历史草稿 | PASS | `draft-v0`、`draft-v1`、`draft-v2`、`draft-v3` 与 final-v1 均独立存在 |

## 七、最终交付门槛

官方事实与 13 项 No-Go 已通过。根任务完成以下三项后，final-v1 可进入最终交付：

1. 应用 P1-1 的执行面／内部实现边界修订。
2. 应用 P1-2 的 BrowseComp 历史训练主体修订。
3. 按 P1-3 补齐两张本地图片与视觉复核 v2，或移除失效嵌入与链接。

P2 修改不会推翻报告主结论；完成后可显著降低把系统推断误读为直接事实的风险。
