# GPT-5.6 Sol Ultra 长程 Agent 研究包

## 结论与推荐入口

当前推荐交付版本是 [final-v4：GPT-5.6 Sol Ultra 如何做好长程 Agent 任务](final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)。该版本把官方事实、当前 Codex 源码、公开训练方向、评测有效性、视觉证据、工程推断和未知项分层，直接回答三项观察：子 Agent 规划、任务状态落盘、token 限额附近的状态落盘。

[最终验收记录](sources/final-acceptance.md) 给出独立审查、hash、链接、视觉、源码 anchors、历史版本和测试边界。最终状态为：`P0=0 / P1=0 / P2=0`，`75/75` checklist、`13/13` No-Go 全部通过。

## 版本历史

所有版本都是独立文件；后续版本没有覆盖前一版本。

| 版本 | 文件 | 角色 | SHA-256 |
|---|---|---|---|
| draft-v0 | [证据地图](draft-v0-evidence-map.md) | 研究范围、问题树与证据缺口 | `5908642E...65EA23` |
| draft-v1 | [来源综合](draft-v1-source-synthesis.md) | 官方材料、源码与训练/评测初次综合 | `0595A1E8...190AD` |
| draft-v2 | [因果架构与评测](draft-v2-causal-architecture-and-evals.md) | 七层系统、因果边界与 benchmark 解释 | `2B166E5C...2AD76` |
| draft-v3 | [审后 Claim Ledger](draft-v3-reviewed-claim-ledger.md) | 逐项 F1/F2/F3/I1/I2/U 校准 | `FD56879D...A1FD` |
| final-v1 | [首个整合终稿](final-v1-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md) | 首轮全景报告，保留独立审查发现 | `1BDE3F19...A33B` |
| final-v2 | [吸收 P1 的终稿](final-v2-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md) | 修复 Goal、评测、视觉和证据归属 P1 | `7122BD2D...7436E` |
| final-v3 | [源码精化终稿](final-v3-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md) | 补全 usage-limit 三态与精确源码 anchors | `DDD4F92A...0C61B` |
| final-v4 | [推荐终稿](final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md) | 收紧 Figure 7 因果归属、双页码和跨图边界 | `8E55035B...79B11` |

完整 64 位 hash 见 [最终验收记录](sources/final-acceptance.md)。

## 核心证据包

| 证据包 | 主要用途 |
|---|---|
| [官方模型与 Codex 核验](sources/official-model-and-codex.md) | Sol/Ultra/Max/Pro、公开模型能力、Responses、Codex 官方 Harness 说法 |
| [当前源码长程机制审计](sources/local-codex-long-horizon-code.md) | V2 Agent、rollout、compaction、WorldState、Goal、PlanUpdate、预算与 Unified Exec |
| [公开训练、评测与 Harness 证据](sources/public-training-evals-harness.md) | GPT-5.6 直接训练披露、历史训练方向、论文与产品 Harness |
| [benchmark 与 eval 独立审计](sources/benchmark-and-eval-audit.md) | Ultra 点估计、Terminal/DeepSWE/ALE/GeneBench/MRCR/GraphWalks 有效性与选择偏差 |
| [最终结构与验收门槛](sources/final-report-structure-and-acceptance.md) | 三项答案合同、75 项 checklist、13 项 No-Go |
| [官方视觉证据审计 v3](sources/visual-evidence-audit-v3.md) | Figure 7、Deployment Figure 1/2、来源传输、hash、页码、数值与限制 |

## 独立审查链

研究采用“实现/写作”和“独立验收”分离。关键审查按时间保留：

- 初稿审查：[v1 官方](sources/review-v1-official-and-inference.md)、[v1 源码](sources/review-v1-code-facts.md)、[v2 评测因果](sources/review-v2-evals-and-causality.md)、[v3 官方 ledger](sources/review-v3-official-ledger.md)、[v3 源码 ledger](sources/review-v3-code-ledger.md)。
- final-v1 终审：[官方](sources/review-final-v1-official.md)、[源码](sources/review-final-v1-code.md)、[总验收](sources/review-final-v1-acceptance.md)。
- final-v2 复验：[官方/视觉](sources/review-final-v2-official.md)、[源码](sources/review-final-v2-code.md)、[75 项验收](sources/review-final-v2-acceptance.md)。
- final-v3 delta：[源码](sources/review-final-v3-code-delta.md)、[总验收](sources/review-final-v3-acceptance.md)。
- final-v4 无保留验收：[官方/视觉](sources/review-final-v4-official-visual-delta.md)、[源码回归](sources/review-final-v4-code-regression.md)、[总验收](sources/review-final-v4-acceptance.md)。

## 视觉与原始工件

推荐报告展示两张官方视觉：

- [System Card Figure 7 最终裁剪](assets/gpt-5-6-system-card-figure-7-internaldep-v3.png)，来源为 [System Card PDF 整页渲染](output/pdf/gpt-5-6-system-card-page-20.png)。
- [Deployment Simulation 网页 Figure 1](assets/deployment-simulation-figure-1-production-resampling.png)，原始 [SVG](assets/deployment-simulation-figure-1-production-resampling.svg)。
- [Deployment Simulation 论文 Figure 2 最终裁剪](assets/deployment-simulation-paper-figure-2-pipeline-v3.png)，来源为 [论文 PDF 整页渲染](output/pdf/deployment-simulation-page-03.png)。

历史裁剪 v1/v2 继续保留，用于显示视觉 QA 的裁剪演进。官方 PDF、文本抽取与整页渲染位于 `output/pdf/`。`sources/assets/` 只保存一个 byte-identical 兼容副本，用于解析历史 review 中已经冻结的相对图片路径。Playwright 网络诊断位于 `output/playwright/`。一次失效镜像返回的 HTML 已按仓库规则移动到根目录 `待删除/research-download-failures/`，没有进入证据链。

## 验证摘要

- final-v4：62,793 字节、618 行、77 个本地引用、69 个唯一目标、0 缺失、0 行号越界。
- 源码 anchors：32 个，语义落点与行号范围均通过独立复验。
- 视觉：三张最终图均经过 `view_image` 原图检查；PDF、SVG、PNG 的 hash 与尺寸进入视觉审计。
- 归档：System Card PDF 本地 SHA-1 Base32 与 Archive CDX digest 完全一致。
- 风格：第三人称、结论优先；自动风格与占位文本检查为零命中，fenced block 完整闭合。
- 源码：未修改 Rust；研究绑定 commit `26f5998e172c4aed1e88800feb6b153df5c0fe51`。
- 测试：该交付只新增研究与视觉工件，未运行 Rust 测试；现有测试仅作为静态源码证据读取。
