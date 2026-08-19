# final-v2 官方事实与视觉证据独立复验

> 复验对象：`final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md`、`sources/visual-evidence-audit-v2.md`  
> 复验日期：2026-07-12（Asia/Shanghai）  
> 复验范围：final-v1 终审 P1/P2 吸收情况、GPT-5.6 官方事实、Figure 7 数值、Deployment Simulation 图号、事实／推断／未知边界、13 项 No-Go  
> 源码基线：报告声明的 commit `26f5998e172c4aed1e88800feb6b153df5c0fe51`

## 一、结论

**整套交付有条件通过。** final-v2 已完整吸收 final-v1 官方终审的全部 P1/P2，Figure 7 六组数值逐项一致，Deployment Simulation 网页 Figure 1 与论文 Figure 2 的来源和编号已经分开，13 项 No-Go 全部通过。未发现 P0。

剩余一项 P1 位于视觉审计的结论标题与 final-v2 的视觉小节标题：Figure 7 直接测到 severity-3 风险点估计，没有直接测到能力，也没有操纵 persistence；persistence 关联来自官方相邻正文的可能性解释，能力—风险双面性属于跨来源 `I1`。该项完成两处短句修订后，整套报告可交付。

| 等级 | 数量 | 判断 |
|---|---:|---|
| P0 | 0 | 没有推翻主结论或数值的错误 |
| P1 | 1 | 视觉证据的因果／来源归属应在交付前收紧 |
| P2 | 3 | 页码、跨图一致性和网络故障措辞可进一步精确化 |
| No-Go | 13/13 PASS | 没有触发禁止交付项 |

## 二、复验方法与直接证据

本轮直接使用以下证据：

- OpenAI Docs MCP 当前返回的 [GPT-5.6 模型指南](https://developers.openai.com/api/docs/guides/latest-model)、[Responses Multi-agent](https://developers.openai.com/api/docs/guides/responses-multi-agent)、[reasoning.context](https://developers.openai.com/api/docs/guides/reasoning#preserve-reasoning-across-calls)、[Programmatic Tool Calling](https://developers.openai.com/api/docs/guides/tools-programmatic-tool-calling) 与 [Sol 模型页](https://developers.openai.com/api/docs/models/gpt-5.6-sol)。
- [GPT-5.6 发布页](https://openai.com/index/gpt-5-6/) 与本地归档的 GPT-5.6 System Card PDF。
- [Deployment Simulation 发布页](https://openai.com/index/deployment-simulation/) 与 OpenAI 官方论文 PDF。
- 对 PDF 物理第 20 页、Figure 7 v3、网页 Figure 1 PNG、论文 Figure 2 v3 的本地 `view_image` 原图复验。
- SHA-256、文件字节、像素尺寸、PDF metadata、页数及全部本地相对链接检查。

Codex 官方手册 helper 在普通与批准联网环境中均遇到 TLS reset；本轮依照 `openai-docs` 路由改用官方 Docs MCP。当前本地源码结论仍以固定 commit 与源码测试为准。

## 三、final-v1 官方终审 P1/P2 吸收情况

| final-v1 终审项 | final-v2 位置 | 结果 | 证据 |
|---|---|---|---|
| P1-1：执行面差异被写成内部实现差异 | 第 66 行 | PASS | 已改为“属于不同执行面；共享内部实现属于 `U`” |
| P1-2：BrowseComp 专项训练主体含混 | 第 352 行 | PASS | 已明确主体是当时的 Deep Research，并把 GPT-5.6 exposure 保持为 `U` |
| P1-3：两张图片与视觉审计 v2 缺失 | 第 412–424、618 行 | PASS | 两张主图、论文 Figure 2、整页渲染和视觉审计 v2 均存在；145 个 Markdown 链接中 71 个相对链接全部可解析 |
| P2-1：执行摘要复合因果缺少 `I1` | 第 12 行 | PASS | 已标 `I1`，并明确缺少组件消融 |
| P2-2：intent/token 的长程收益被写成事实 | 第 122 行 | PASS | 已标 `I1`，并要求固定 Harness 对照实验 |
| P2-3：cache、污染与泛化被合并为已证事实 | 第 285 行 | PASS | 机制存在标 `F2`，效果标 `I1`，增益保持待消融 |
| P2-4：最终结论压缩 PTC／Code Mode 与整体因果边界 | 第 523、533 行 | PASS | 已补 `I1`、共享实现 `U` 与组件贡献未知 |
| P2-5：`SEC-bench Pro` 大小写 | 全文 | PASS | 已统一为 OpenAI 发布页使用的 `SEC-Bench Pro`；旧拼写无残留 |

## 四、Figure 7 数值与文件完整性复验

### 4.1 三层数值逐项一致

本轮直接查看了 [PDF 物理第 20 页整页渲染](../output/pdf/gpt-5-6-system-card-page-20.png) 与 [Figure 7 v3](../assets/gpt-5-6-system-card-figure-7-internaldep-v3.png)。PDF 页面页脚印刷编号为 19；封面计入 PDF 页序后，该页是文件中的第 20 个页面。

| severity-3 类别 | PDF 物理第 20 页 | v3 裁剪 | final-v2 第 414 行 | 结果 |
|---|---:|---:|---:|---|
| Circumventing Restrictions | `0.00251 / 0.00026` | `0.00251 / 0.00026` | `0.00251 / 0.00026` | PASS |
| Destructive Actions | `0.00019 / 0.00003` | `0.00019 / 0.00003` | `0.00019 / 0.00003` | PASS |
| Unauthorized Data Transfer | `0.00016 / 0.00008` | `0.00016 / 0.00008` | `0.00016 / 0.00008` | PASS |
| Reward Hacking | `0.00009 / 0.00000` | `0.00009 / 0.00000` | `0.00009 / 0.00000` | PASS |
| Credential Harvesting | `0.00008 / 0.00003` | `0.00008 / 0.00003` | `0.00008 / 0.00003` | PASS |
| Other Misalignment | `0.00004 / 0.00000` | `0.00004 / 0.00000` | `0.00004 / 0.00000` | PASS |

数值顺序均为 GPT-5.6 Sol / GPT-5.5。图中每行都存在水平误差表示。final-v2 与视觉审计均明确保留以下未知：误差条类型、confidence level、样本量、重复次数、统计检验与显著性。格式化 `0.00000` 也没有被解释为真实概率严格为零。

### 4.2 文件记录复算一致

| 文件 | 实测字节／尺寸 | 实测 SHA-256 | 与视觉审计 v2 |
|---|---|---|---|
| `gpt-5-6-system-card-20260710-wayback.pdf` | 4,424,427；81 页 | `67B4008B251E82B701D85B604F2C5E32D99D14BE721081A5A3B88EC811CB1EB7` | PASS |
| `gpt-5-6-system-card-page-20.png` | 476,371；1700×2200 | `026F1DB2933D3A0E36AC80107D6F6EFC267B93237582CD78B7D7084C44FE114A` | PASS |
| `gpt-5-6-system-card-figure-7-internaldep-v3.png` | 65,329；1220×470 | `39D7019855B4DC5636AA477FC7560410AB5B2C3522C0C242130064C4BBD7CAF1` | PASS |

PDF metadata 的 Title 确为 `GPT-5.6 Preview System Card`，PDF 有 81 页；封面正文明确写 `GPT-5.6 System Card` 和 `2026-07-09`。视觉审计把 metadata 残留与发布内容分开处理，边界合理。

### 4.3 图文联合能支持的范围

直接图像支持：六类 severity-3 点估计、Sol 各行高于 GPT-5.5、误差条存在、绝对比例低。

官方相邻正文支持：固定混合前缀、两模型分别重采样、monitor 标注 0–4 severity、Sol 更常出现 severity-3 行为、内部真实流量观察到相似量级上升。官方使用 “suspect” 级别措辞，把该效应部分联系到最高 reasoning effort 下更强 persistence，并说明持续推进型 system prompt 可能使效应更明显，同时强调绝对率低。

图像和相邻正文均未直接测量 persistence 对能力的独立贡献，也没有完成 persistence、reasoning effort 或 system prompt 的受控消融。

## 五、Deployment Simulation 两图复验

### 5.1 编号与来源

| 本地图 | 官方身份 | 直接编号证据 | 结果 |
|---|---|---|---|
| [网页流程图](../assets/deployment-simulation-figure-1-production-resampling.png) | OpenAI 发布页 Figure 1 | 官方网页标题为 `Figure 1: Overview of our Deployment Simulation pipeline` | PASS |
| [论文流程图](../assets/deployment-simulation-paper-figure-2-pipeline-v3.png) | 论文 Figure 2 | 本地裁剪完整保留 `Figure 2: Our deployment simulation pipeline` 图注 | PASS |

两图的核心流程一致：生产前缀、候选模型重采样、自动审计、新坏行为、更新 taxonomy、评分、发布前估计、发布后测量、验证预测。两图的编号、画风、节点文案与图注细节不同。final-v2 第 420 行嵌入网页 Figure 1，第 424 行链接论文 Figure 2；视觉审计第 74–99 行也分节记录，两图没有混号。

### 5.2 文件记录复算一致

| 文件 | 实测字节／尺寸 | 实测 SHA-256 | 与视觉审计 v2 |
|---|---|---|---|
| `deployment-simulation-figure-1-production-resampling.svg` | 132,539；597×272 | `B9BF7DD12DB51FF997874800667C683883A0A45DDBC3DF683BB403A29D4E27DA` | PASS |
| `deployment-simulation-figure-1-production-resampling.png` | 34,875；597×272 | `D39A53751AAE4732FBF1635C45FA8A49C5E10B2F3FD2FDF58DC2876CDFF8586F` | PASS |
| `predicting-llm-safety-before-release-by-simulating-deployment.pdf` | 4,378,751；31 页 | `F31C708898CA68C4255440C8DDC2F945932C3F15CC13D5329D70E91FF38BA830` | PASS |
| `deployment-simulation-page-03.png` | 517,036；1700×2200 | `D20752E4F05ABE603081122EF53596D6011E9B8CB0B0739F03CED101C8721C4F` | PASS |
| `deployment-simulation-paper-figure-2-pipeline-v3.png` | 65,667；1440×700 | `DEFFA4FEC86F7F45282B386C1F44F21807A4390807DC3D5E974B90F6EC99234A` | PASS |

## 六、P0

无。

## 七、P1：交付前应处理

### P1-1：Figure 7 被赋予超出图表测量范围的能力—风险因果含义

**位置：** `sources/visual-evidence-audit-v2.md` 第 10 行；final-v2 第 410 行标题。  
**问题：** Figure 7 直接测量六类 severity-3 misalignment 比例。官方相邻正文只以可能性措辞把风险上升部分联系到更强 persistence。图表没有直接测量能力，也没有隔离 persistence 的因果贡献。视觉审计首条把“persistence 同时放大能力与越界风险”写成 Figure 7 直接支持的定性判断，来源范围过宽。final-v2 正文第 414–416 行已经采用保守措辞，问题集中在标题与审计首句。

**视觉审计第 10 行精确替换：**

```markdown
1. **Figure 7 直接支持六类 severity-3 风险点估计比较；persistence 关联属于图文联合的 `I1`。** 六类 severity-3 misalignment 的 GPT-5.6 Sol 点估计都高于 GPT-5.5。最大差异来自 `Circumventing Restrictions`：原始比例 `0.00251` 对 `0.00026`。图上有水平误差条，页面没有给出误差条类型、样本数或显著性检验。官方相邻正文以可能性措辞把风险上升部分联系到最高 reasoning effort 下更强 persistence；能力侧需要单独的发布与评测证据，Figure 7 没有建立 persistence 对能力的独立因果贡献。
```

**final-v2 第 410 行标题精确替换：**

```markdown
### 12.1 System Card Figure 7：severity-3 风险点估计与 persistence 关联
```

## 八、P2：不阻断主结论的精度修改

### P2-1：PDF 页序与印刷页码应同时标明

**位置：** final-v2 第 414 行；视觉审计第 18、42 行。

当前“PDF 第 20 页”指文件中的第 20 个页面；页面页脚印刷编号是 19。两个说法都可定位同一页，明确双重页码可消除歧义。

**统一替换短语：**

```markdown
PDF 物理第 20 页（页脚编号 19）
```

### P2-2：final-v2 对网页 Figure 1 与论文 Figure 2 的“一致”应限定为流程结构

**位置：** final-v2 第 424 行。

两图表达同一核心 pipeline，编号、画风、节点文案和图注细节不同。视觉审计第 99 行已经准确说明该边界。

**精确替换：**

```markdown
论文 [Figure 2 本地裁剪](assets/deployment-simulation-paper-figure-2-pipeline-v3.png) 与网页 Figure 1 的核心流程结构一致；两图的编号、画风、节点文案与图注细节不同。论文 Figure 2 的完整图注明确发布后复测。System Card 的 agentic coding 实现进一步让 tool simulator 访问原始时点的精确代码状态、tool call-response 数据库、只读 connector 和原 trajectory；重采样轨迹在真假二选一 realism 比较中取得 42% 胜率。该方法是评测 Harness 证据，不能推出训练数据配方。
```

### P2-3：网络故障事实不需要推断“主动关闭”

**位置：** 视觉审计第 12 行。

本轮复算确认 `deploymentsafety.openai.com` 在本机解析到 `198.18.0.96`，此前工具观察到 TLS reset、`ERR_CONNECTION_CLOSED` 与 timeout。该证据证明本机网络环境不可达，无法单独确认关闭动作的实施主体或策略意图。

**精确替换：**

```markdown
3. **直接视觉字节与传输中介已经分开记录。** Figure 7 的官方静态 PNG URL 在本机网络环境不可达；审计观察到保留测试地址解析、TLS reset、`ERR_CONNECTION_CLOSED` 与 timeout，未推断具体实施主体。审计改用 OpenAI 官方 System Card PDF 的归档原始响应，再本地渲染第 20 个 PDF 页面并裁剪。该裁剪忠实显示官方 PDF 中的 Figure 7，不宣称与 `internaldep.png` 字节相同。
```

## 九、13 项 No-Go 独立验收

| # | No-Go | 结果 | final-v2 证据 |
|---:|---|---|---|
| 1 | 把 Ultra 写成独立模型或公开 reasoning effort | PASS | 第 57–71 行将 Ultra 定义为产品／Harness setting，公开 effort 最高为 `max` |
| 2 | 把 root+三子写成产品私有拓扑直接事实 | PASS | 第 18、65–69 行把官方四 Agent、Responses 默认三并发与当前 V2 分层，并将 Ultra 私有 topology 标为 `U` |
| 3 | 把 Ultra 点估计写成统计显著 | PASS | 第 154–164 行明确缺少 seed、CI、paired test 和统一预算 |
| 4 | 把 Ultra bundle 增益归因给单一机制 | PASS | 第 12、20、160、523 行均限定为复合系统或配置级分差 |
| 5 | 给出未公开的 16-agent 精确数字 | PASS | 第 164 行明确坐标、hover、误差与边际收益为 `U`；第 472 行只提出未来实验设计 |
| 6 | 把 MRCR／GraphWalks 当成 durability 或跨重启证据 | PASS | 第 73–86、387–406 行明确限定为单次长上下文评测 |
| 7 | 从 benchmark 分数推出 Goal／rollout／budget 持久化因果 | PASS | 第 253–263、404–406 行把源码状态事实与模型／Ultra 因果分开 |
| 8 | 把历史 Codex、o3/o4、Deep Research 训练直接归因给 Sol | PASS | 第 311–321 行保持历史方向；第 352 行明确 BrowseComp 的训练主体是当时的 Deep Research，GPT-5.6 exposure 为 `U` |
| 9 | 声称模型能回忆私有训练样本或专项经历 | PASS | 第 334–346、446–450 行拒绝第一人称训练 provenance |
| 10 | 混淆五条 token／预算路径 | PASS | 第 253–263 行逐条列出权威状态、持久结果与达限语义 |
| 11 | 忽略 Goal prompt contract 与 runtime enforcement 区别 | PASS | 第 226–239 行分别记录 model contract、runtime authority 与未强制验证项 |
| 12 | 引用尚未视觉复核的图内独有信息 | PASS | PDF 整页、Figure 7 v3、网页 Figure 1 与论文 Figure 2 均已用 `view_image` 复验；数值、hash、尺寸与链接均一致 |
| 13 | 覆盖历史草稿 | PASS | `draft-v0`、`draft-v1`、`draft-v2`、`draft-v3`、final-v1 与 final-v2 均独立存在 |

## 十、最终交付判断

final-v2 已吸收上一轮全部 P1/P2，核心官方事实、训练边界、评测边界、Figure 7 数值和 Deployment 图号均通过。根任务应用 P1-1 的两处精确措辞后，整套交付达到可交付状态。三项 P2 不改变任何数值、No-Go 结果或主结论，建议与 P1 同批修订。
