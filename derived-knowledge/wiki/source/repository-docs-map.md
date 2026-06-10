---
title: "仓库文档证据图"
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - "source"
  - "docs"
  - "map"
sources:
  - "derived-knowledge/index.md"
  - "derived-knowledge/raw/understand-graph-summary.json"
  - "derived-knowledge/raw/source-file-map.json"
  - "README.md"
  - "AGENTS.md"
  - "package.json"
  - "codex-rs/Cargo.toml"
  - "codex-rs/README.md"
  - "codex-rs/app-server/README.md"
---

## 定义

仓库文档证据图 是 derived wiki 的证据入口页，用来组织 raw JSON、源码路径、测试路径和本地研究材料的证据组织。它的角色像资料馆目录：页面本身不替代码下结论，只把可复查的路径、图谱节点和主题用途组织起来。

在图谱语言里，证据包可看作 \(G=(V,E)\) 的压缩索引：文件、概念和测试是 \(V\)，imports、contains、documents 等关系是 \(E\)。本页帮助后续 `understand-knowledge` 从 wiki 文本恢复主题层与来源层。

## 为什么重要

后续图谱构建依赖输入页之间的可追溯性。没有来源页，wiki 会只剩二级解释；有来源页后，读者可以从结论回跳到 raw JSON、源码文件和测试证据。

这也降低了幻觉传播风险：如果某个安全断言无法落到文件路径或测试路径，它应被归入待验证问题，不应进入稳定事实层。

## 代码仓证据

- `README.md`：作为本页的直接证据路径，用来限定关于 仓库文档证据图 的陈述范围。
- `AGENTS.md`：作为本页的直接证据路径，用来限定关于 仓库文档证据图 的陈述范围。
- `package.json`：作为本页的直接证据路径，用来限定关于 仓库文档证据图 的陈述范围。
- `codex-rs/Cargo.toml`：作为本页的直接证据路径，用来限定关于 仓库文档证据图 的陈述范围。
- `codex-rs/README.md`：作为本页的直接证据路径，用来限定关于 仓库文档证据图 的陈述范围。
- `codex-rs/app-server/README.md`：作为本页的直接证据路径，用来限定关于 仓库文档证据图 的陈述范围。
- `derived-knowledge/raw/source-file-map.json`：把上述文件与图谱节点、符号名和主题用途连到一起，是当前输入包的证据索引。

## 待验证问题

- 需要确认 raw JSON 是否应在正式图谱构建前继续压缩，避免把函数级节点噪声带入知识层。
- 需要人工复核每个来源路径是否仍存在于当前 commit，尤其是移动频繁的 app-server、MCP 和 memory 模块。
- 需要决定哪些本地研究笔记可以作为来源，哪些只能作为问题线索。

## Related

- [[orientation/repository-map]]
- [[architecture/app-server-desktop-api]]
- [[security/security-control-map]]
- [[source/test-evidence-map]]
- [[questions/wiki-granularity]]
