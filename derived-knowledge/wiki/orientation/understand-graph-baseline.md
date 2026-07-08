---
title: Understand Graph Baseline
type: orientation
created: 2026-06-01
updated: 2026-06-01
tags:
  - orientation
  - understand-anything
  - graph-baseline
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/understand-graph-summary.json
  - derived-knowledge/raw/source-file-map.json
  - .understand-anything/knowledge-graph.json
  - .understand-anything/meta.json
---

## 定义

`Understand Graph Baseline` 是本轮 derived wiki 的结构底座：它来自现有 `.understand-anything/knowledge-graph.json`，再由 `derived-knowledge/raw/understand-graph-summary.json` 和 `derived-knowledge/raw/source-file-map.json` 压缩成页面作者可读的 evidence 包。

可用数学记号描述为 \(G=(V,E,L,T)\)：\(V\) 是 nodes，\(E\) 是 edges，\(L\) 是 layers，\(T\) 是 tour steps。当前 baseline 显示 \( |V|=39902 \)，\( |E|=39927 \)，\( |L|=21 \)，\( |T|=10 \)，并覆盖 4582 个 analyzed files。这个图很像城市地铁图：它擅长告诉读者站点、线路和换乘关系；它对真实运行时的拥堵、时序、事故原因只能提供线索，不能直接给出因果结论。

## 为什么重要

图 baseline 把大仓库拆成可导航的 layer 和 tour。它能帮助页面作者快速找到“先读哪一层”和“某个概念常出现在哪些路径”。例如 `layer:mcp-tools-skills-and-connectors` 直接把 `codex-rs/codex-mcp`、`core-skills`、`plugin`、`connectors` 放到同一阅读区域；`layer:sandbox-exec-security-and-host-integration` 把 shell、execpolicy、sandbox、guardian、host hardening 归到同一个安全面。

同时，图的局限必须写进 wiki：当前 edge types 以 `contains` 和 `imports` 为主，`calls` 只有 2 条。这意味着图可证明“文件和符号被发现、分层、包含或导入”，对“函数 A 一定在运行时调用函数 B”的证明力很弱。动态行为仍需源码、测试和文档复核。

## 代码仓证据

- `derived-knowledge/raw/understand-graph-summary.json`: `generatedAt` 为 `2026-06-01T05:45:12.902Z`；`graphStats` 为 39902 nodes、39927 edges、21 layers、10 tour steps、4582 analyzedFiles。
- `derived-knowledge/raw/understand-graph-summary.json`: `nodeTypes` 包含 `file` 3423、`config` 459、`document` 636、`concept` 3466、`function` 26140、`class` 5644。
- `derived-knowledge/raw/understand-graph-summary.json`: `edgeTypes` 以 `contains` 35320、`imports` 4588 为主，另有少量 `documents`、`configures`、`triggers`、`calls`、`depends_on`。
- `derived-knowledge/raw/understand-graph-summary.json`: `layers` 包含 `Repository Orientation`、`Rust Core Agent Runtime`、`App Server and Desktop API`、`MCP, Tools, Skills, and Connectors`、`Sandbox, Exec Policy, Security, and Host Integration`、`SDK Runtime and Schema Generation`、`Local Knowledge Overlay` 等。
- `derived-knowledge/raw/understand-graph-summary.json`: `tour` 以 `Repository Orientation` 开始，经过 `Rust Workspace Shape`、`Agent Core Loop`、`Native CLI and TUI`、`App Server API`、`Tools, MCP, Plugins, and Skills`、`Sandbox and Execution Policy`，最后到 docs/local wiki。
- `derived-knowledge/raw/source-file-map.json`: 将 orientation、architecture、security、long_horizon、owasp_tc260 等主题映射到候选 evidence files，并明确提醒 page writers 将未证明的 design intent 写为待验证。
- `.understand-anything/meta.json`: evidence 包声明该文件为 graph meta path，记录 `lastAnalyzedAt`、`gitCommitHash`、`analyzedFiles` 等基线信息。

## 待验证问题

- graph baseline 的 `gitCommitHash` 是 `b14f11d3d2ca048bdae1872ef66087a2ce3f6b0c`；当前 checkout 若有后续变更，所有“当前代码如此”的断言都需要重新跑局部核验。
- edge 类型里 `calls` 极少，复杂运行路径应优先通过源码和 tests 复核，不能只凭 graph edges 推导。
- evidence 包记录 `unknowns.kind = design_intent_gap`：图能证明结构和关系，不能证明历史原因、产品意图、安全保证。
- evidence 包记录 index wikilink 数为 93；若用户计划文本曾提到其他数量，应以 `derived-knowledge/index.md` 当前文件为准。

## Related

- [[source/understand-code-graph-summary]]
- [[source/security-relevant-file-map]]
- [[orientation/repository-map]]
- [[orientation/onboarding-tour]]
- [[memory/knowledge-graph-as-memory-layer]]
- [[questions/wiki-granularity]]
