---
title: "Agent Memory 策略问题"
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - "questions"
  - "memory"
  - "policy"
sources:
  - "derived-knowledge/index.md"
  - "derived-knowledge/raw/understand-graph-summary.json"
  - "derived-knowledge/raw/source-file-map.json"
  - "codex-rs/memories/README.md"
  - "codex-rs/memories/read/src/lib.rs"
  - "codex-rs/memories/read/src/citations.rs"
  - "codex-rs/memories/read/templates/memories/read_path.md"
  - "codex-rs/memories/write/src/phase1.rs"
  - "codex-rs/memories/write/src/phase2.rs"
  - "codex-rs/memories/write/src/control.rs"
---

## 定义

Agent Memory 策略问题 收集的是需要人工确认的问题，覆盖 需要人工复核的设计意图、安全保证和 wiki 粒度问题。这些问题用于把“源码已经证明的事实”和“仍需产品、历史或安全评审确认的意图”分开。

这类页面像审计清单：它不扩大结论，只列出目前证据链的缺口、下一步阅读路径和可能影响安全边界的判断点。

## 为什么重要

这些问题重要，因为源码能回答“当前如何运行”，却经常无法回答“为什么这样设计”或“安全承诺到哪里为止”。把问题显式化，可以防止 wiki 把推测写成事实。

后续人工复核可以按问题页分派：产品意图、协议边界、审计保证、memory 策略和工具信任边界分别需要不同证据。

## 代码仓证据

- `codex-rs/memories/README.md`：作为本页的直接证据路径，用来限定关于 Agent Memory 策略问题 的陈述范围。
- `codex-rs/memories/read/src/lib.rs`：作为本页的直接证据路径，用来限定关于 Agent Memory 策略问题 的陈述范围。
- `codex-rs/memories/read/src/citations.rs`：作为本页的直接证据路径，用来限定关于 Agent Memory 策略问题 的陈述范围。
- `codex-rs/memories/read/templates/memories/read_path.md`：作为本页的直接证据路径，用来限定关于 Agent Memory 策略问题 的陈述范围。
- `codex-rs/memories/write/src/phase1.rs`：作为本页的直接证据路径，用来限定关于 Agent Memory 策略问题 的陈述范围。
- `codex-rs/memories/write/src/phase2.rs`：作为本页的直接证据路径，用来限定关于 Agent Memory 策略问题 的陈述范围。
- `codex-rs/memories/write/src/control.rs`：作为本页的直接证据路径，用来限定关于 Agent Memory 策略问题 的陈述范围。
- `derived-knowledge/raw/source-file-map.json`：把上述文件与图谱节点、符号名和主题用途连到一起，是当前输入包的证据索引。

## 待验证问题

- 哪些问题需要产品或维护者确认，哪些可以通过源码和测试直接关闭？
- 哪些判断会改变安全边界、用户承诺或文档表述，需要在 PR 前单独标注？
- 哪些问题只影响 wiki 粒度，可以延后到图谱生成后的 review 轮处理？

## Related

- [[memory/memory-threat-model]]
- [[memory/session-isolation-and-memory-mode]]
- [[memory/knowledge-graph-as-memory-layer]]
- [[source/local-research-notes]]
- [[tc260/aia10-memory-hallucination-and-manipulation]]
