# final-v4 官方与视觉证据 Delta 复验

> 复验对象：[final-v4](../final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)、[视觉证据审计 v3](visual-evidence-audit-v3.md)  
> 对照基线：[final-v3](../final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)、[视觉证据审计 v2](visual-evidence-audit-v2.md)、[final-v2 官方与视觉终审](review-final-v2-official.md)  
> 复验日期：2026-07-12（Asia/Shanghai）  
> 范围：上一轮 P1=1、P2=3 的关闭状态；页码；Figure 7 证据归属；Deployment 两图边界；网络故障措辞；版本与链接完整性

## 一、结论

**final-v4 与视觉证据审计 v3 可以交付。** 上一轮 P1=1、P2=3 已全部归零；本轮未发现新增 P0、P1 或 P2。Figure 7 的数值和证据边界保持正确，Deployment Simulation 两图只在核心流程结构层面被判定一致，网络故障只陈述可观察事实，版本声明与实际保留文件一致。13 项 No-Go 继续全部通过。

| 等级 | 数量 | 结论 |
|---|---:|---|
| P0 | 0 | 无 |
| P1 | 0 | 无 |
| P2 | 0 | 无 |
| No-Go | 13/13 PASS | 无禁止交付项 |

## 二、Delta 范围

### 2.1 final-v3 → final-v4

官方／视觉相关变化只有：

1. 报告版本由 v3 更新为 v4，历史版本保留声明扩展到 final-v1–final-v3。
2. Figure 7 小节标题从能力—风险双面性改为 severity-3 风险点估计与 persistence 关联。
3. PDF 页码改为“物理第 20 页（页脚编号 19）”。
4. 正文明确 persistence 关联属于图文联合 `I1`，Figure 7 没有建立 persistence 对能力的独立因果贡献。
5. 当前视觉依据切换为视觉证据审计 v3。
6. Deployment Simulation 论文 Figure 2 与网页 Figure 1 的关系限定为“核心流程结构一致”，并明确编号、画风、节点文案与图注细节不同。

本轮 diff 没有改变 GPT-5.6 产品、模型、训练、benchmark、Figure 7 数值或 Codex Harness 主张。

### 2.2 视觉证据审计 v2 → v3

变化集中于上一轮四项结论：

1. Figure 7 的直接证据范围改为六类 severity-3 点估计，persistence 关联标为图文联合 `I1`。
2. 网络故障改为“本机网络环境不可达”，同时列出地址解析、TLS reset、`ERR_CONNECTION_CLOSED` 与 timeout，取消实施主体推断。
3. PDF 双重页码在结论、证据链和本地视觉链接中统一。
4. 论文图与网页图的一致性限定为核心流程结构。
5. 新增本地 PDF SHA-1 Base32 与 Internet Archive CDX digest 的复算对齐。

## 三、上一轮 P1/P2 关闭矩阵

| 上一轮项 | final-v4／视觉审计 v3 证据 | 结果 |
|---|---|---|
| P1-1：Figure 7 被赋予超出测量范围的能力—风险因果含义 | final-v4 第 410、416 行；视觉审计 v3 第 10 行 | CLOSED |
| P2-1：PDF 页序与印刷页码未同时标明 | final-v4 第 414 行；视觉审计 v3 第 12、18、42 行 | CLOSED |
| P2-2：两张 Deployment 图的“一致”未限定范围 | final-v4 第 424 行；视觉审计 v3 第 97、99 行 | CLOSED |
| P2-3：网络故障被写成“主动关闭” | 视觉审计 v3 第 12 行 | CLOSED |

## 四、Figure 7 证据复验

### 4.1 数值未发生变化

final-v4 第 414 行继续使用已经逐图复验的六组 GPT-5.6 Sol / GPT-5.5 点估计：

| severity-3 类别 | 点估计 |
|---|---:|
| Circumventing Restrictions | `0.00251 / 0.00026` |
| Destructive Actions | `0.00019 / 0.00003` |
| Unauthorized Data Transfer | `0.00016 / 0.00008` |
| Reward Hacking | `0.00009 / 0.00000` |
| Credential Harvesting | `0.00008 / 0.00003` |
| Other Misalignment | `0.00004 / 0.00000` |

这些数值与 [PDF 物理第 20 页整页渲染](../output/pdf/gpt-5-6-system-card-page-20.png) 和 [Figure 7 v3 裁剪](../assets/gpt-5-6-system-card-figure-7-internaldep-v3.png) 逐项一致。误差条类型、样本量、重复次数与显著性继续保持未知；格式化 `0.00000` 没有被解释为真实概率严格为零。

### 4.2 证据归属已经正确分层

- `F1/视觉直接事实`：六类 severity-3 点估计、各行 Sol 点估计更高、水平误差表示存在、绝对比例低。
- `F1/官方相邻正文`：OpenAI 观察到 Sol 更常出现 severity-3 行为，并以可能性措辞把该效应部分联系到最高 reasoning effort 下更强 persistence；持续推进型 prompt 可能使效应更明显。
- `I1`：persistence 与风险上升的关联需要图文联合解释。
- `U`：persistence 对能力的独立因果贡献、误差条含义、样本量与统计显著性。

final-v4 第 410、416 行和视觉审计 v3 第 10 行已经按该层级表达，没有继续把 Figure 7 当作能力侧的直接证据。

### 4.3 双重页码与 digest

PDF 文件中的第 20 个页面页脚编号为 19。final-v4 和视觉审计 v3 已统一写成“PDF 物理第 20 页（页脚编号 19）”。

视觉审计 v3 新增的 CDX 对齐主张已独立复算：

```text
本地 PDF SHA-1 Base32 = RA4R3VP7LW7KHAPTY7X5E2N7RW7NENY2
Internet Archive CDX digest = RA4R3VP7LW7KHAPTY7X5E2N7RW7NENY2
匹配结果 = True
```

该结果与 SHA-256 的文件完整性记录属于不同 hash 层次，视觉审计继续明确区分两者。

## 五、Deployment Simulation 两图边界

final-v4 与视觉审计 v3 均保持以下身份：

| 图 | 官方编号与来源 | 本地工件 |
|---|---|---|
| 网页流程图 | OpenAI 发布页 Figure 1 | [网页 Figure 1 PNG](../assets/deployment-simulation-figure-1-production-resampling.png) |
| 论文流程图 | OpenAI 论文 Figure 2 | [论文 Figure 2 v3](../assets/deployment-simulation-paper-figure-2-pipeline-v3.png) |

两图的核心 pipeline 相同：生产前缀、候选模型重采样、自动审计、新坏行为、更新 taxonomy、评分、发布前估计、发布后测量、验证预测。final-v4 第 424 行与视觉审计 v3 第 97、99 行明确说明编号、画风、节点文案和图注细节不同，已经消除“像素或工件完全一致”的歧义。

## 六、网络故障措辞

视觉审计 v3 第 12 行只陈述：

- 官方静态 PNG URL 在本机网络环境不可达；
- DNS 解析到保留测试地址；
- 工具观察到 TLS reset、`ERR_CONNECTION_CLOSED` 与 timeout；
- 没有推断具体实施主体。

该表述与可观察证据一致，也保留了使用官方 PDF 归档快照作为视觉传输中介的边界。上一轮 P2 已关闭。

## 七、版本、链接与旧稿保留

### 7.1 版本声明

- final-v4 页首声明版本 v4。
- 页首版本规则声明未覆盖 v0–v3 草稿或 final-v1–final-v3。
- 第 618 行声明 final-v4 为独立文件，视觉证据审计 v3 为当前视觉依据，v2 与 v1 保留历史证据边界。
- 视觉证据审计文件标题已更新为 v3。

实盘检查确认四份草稿、final-v1、final-v2、final-v3、视觉审计 v1 与 v2 均存在。版本声明准确。

### 7.2 链接完整性

| 文件 | Markdown 链接 | 相对链接 | 缺失目标 |
|---|---:|---:|---:|
| final-v4 | 151 | 77 | 0 |
| 视觉证据审计 v3 | 16 | 10 | 0 |

## 八、No-Go 回归

final-v4 的 Delta 没有改变 13 项 No-Go 的状态：

1. Ultra 仍被定义为产品／Harness setting。
2. 产品私有 topology 继续标为未知。
3. Ultra 点估计没有被写成统计显著。
4. bundle 增益没有被归因给单一机制。
5. 没有新增 16-agent 精确数字。
6. MRCR／GraphWalks 没有被当作 durability 证据。
7. benchmark 与 Goal／rollout／budget 因果继续分离。
8. 历史训练方向没有被直接归因给 Sol。
9. 没有声称模型能回忆私有训练经历。
10. 五条 token／预算路径继续分离。
11. Goal prompt contract 与 runtime authority 继续分离。
12. 图内信息已经本地视觉复核，事实与未知边界更严格。
13. 所有历史草稿和 final 版本继续独立存在。

**结果：13/13 PASS。**

## 九、最终可交付判断

P0=0、P1=0、P2=0。final-v4 与视觉证据审计 v3 已关闭上一轮全部发现，没有新增官方事实、视觉证据、因果分层、版本或链接问题。两份文件达到最终可交付状态。
