---
title: "OWASP T6 Goal 与 Intent Manipulation"
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - "owasp"
  - "risk-crosswalk"
  - "agent-security"
sources:
  - "derived-knowledge/index.md"
  - "derived-knowledge/raw/understand-graph-summary.json"
  - "derived-knowledge/raw/source-file-map.json"
  - "codex-rs/protocol/src/approvals.rs"
  - "codex-rs/core/src/exec_policy.rs"
  - "codex-rs/sandboxing/src/manager.rs"
  - "codex-rs/windows-sandbox-rs/src/policy.rs"
  - "codex-rs/process-hardening/README.md"
  - "codex-rs/memories/README.md"
---

## 定义

风险含义：OWASP T6 Goal 与 Intent Manipulation 关注 OWASP 风险条目与 Codex 控制点之间的映射关系 中的失控模式。这里的“风险”由触发条件、可利用路径和影响范围组成，可粗略写成 \(R = P \times I \times E\)，其中 \(P\) 是发生概率，\(I\) 是影响强度，\(E\) 是暴露面。

对 Codex 代码仓来说，本页把分类条目映射到 approval、sandbox、MCP、memory、rollout trace、plugin/skill loading 等可观察控制点。标准名称是分类坐标，源码路径是证据锚点；没有源码支撑的设计意图会留在待验证区。

风险含义、Codex 相关控制点、证据路径和缺口在本页四个章节内分别展开。

## 为什么重要

这类风险重要，因为 agent 的副作用来自工具、文件系统、网络、connector 和长期记忆的组合。单个控制点看似局部，组合后会形成跨 turn、跨 thread、跨工具的攻击链。

Codex 的相关控制点包括：权限提示、guardian 评审、exec policy、sandbox policy、MCP tool exposure、memory pollution 标记、rollout trace 与测试夹具。页面的目标是让风险映射能回到具体代码，避免停留在抽象清单。

## 代码仓证据

- `codex-rs/protocol/src/approvals.rs`：作为本页的直接证据路径，用来限定关于 OWASP T6 Goal 与 Intent Manipulation 的陈述范围。
- `codex-rs/core/src/exec_policy.rs`：作为本页的直接证据路径，用来限定关于 OWASP T6 Goal 与 Intent Manipulation 的陈述范围。
- `codex-rs/sandboxing/src/manager.rs`：作为本页的直接证据路径，用来限定关于 OWASP T6 Goal 与 Intent Manipulation 的陈述范围。
- `codex-rs/windows-sandbox-rs/src/policy.rs`：作为本页的直接证据路径，用来限定关于 OWASP T6 Goal 与 Intent Manipulation 的陈述范围。
- `codex-rs/process-hardening/README.md`：作为本页的直接证据路径，用来限定关于 OWASP T6 Goal 与 Intent Manipulation 的陈述范围。
- `codex-rs/memories/README.md`：作为本页的直接证据路径，用来限定关于 OWASP T6 Goal 与 Intent Manipulation 的陈述范围。
- `derived-knowledge/raw/source-file-map.json`：把上述文件与图谱节点、符号名和主题用途连到一起，是当前输入包的证据索引。

## 待验证问题

- 需要用对应标准原文校准分类名称、风险边界和编号含义，当前页面主要依据用户给定 taxonomy 与本地源码证据。
- 需要确认相关控制点在所有入口上是否一致，包括 TUI、app-server、SDK、MCP 和 plugin 路径。
- 需要补充测试或审计样例，证明风险链在异常、拒绝、恢复和 resume 场景下仍有可追踪证据。

## Related

- [[security/security-control-map]]
- [[source/standards-taxonomy-input]]
- [[security/auditability-and-forensics]]
- [[prompt-security/context-poisoning-chain]]
- [[tools/tool-call-lifecycle]]
