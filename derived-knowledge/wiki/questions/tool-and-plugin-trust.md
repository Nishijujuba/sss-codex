---
title: "工具与插件信任问题"
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - "questions"
  - "tools"
  - "trust"
sources:
  - "derived-knowledge/index.md"
  - "derived-knowledge/raw/understand-graph-summary.json"
  - "derived-knowledge/raw/source-file-map.json"
  - "codex-rs/codex-mcp/src/connection_manager.rs"
  - "codex-rs/codex-mcp/src/tools.rs"
  - "codex-rs/codex-mcp/src/runtime.rs"
  - "codex-rs/rmcp-client/src/rmcp_client.rs"
  - "codex-rs/rmcp-client/src/stdio_server_launcher.rs"
  - "codex-rs/core/src/mcp.rs"
  - "codex-rs/core/src/mcp_tool_call.rs"
---

## 定义

工具与插件信任问题 收集的是需要人工确认的问题，覆盖 需要人工复核的设计意图、安全保证和 wiki 粒度问题。这些问题用于把“源码已经证明的事实”和“仍需产品、历史或安全评审确认的意图”分开。

这类页面像审计清单：它不扩大结论，只列出目前证据链的缺口、下一步阅读路径和可能影响安全边界的判断点。

## 为什么重要

这些问题重要，因为源码能回答“当前如何运行”，却经常无法回答“为什么这样设计”或“安全承诺到哪里为止”。把问题显式化，可以防止 wiki 把推测写成事实。

后续人工复核可以按问题页分派：产品意图、协议边界、审计保证、memory 策略和工具信任边界分别需要不同证据。

## 代码仓证据

- `codex-rs/codex-mcp/src/connection_manager.rs`：作为本页的直接证据路径，用来限定关于 工具与插件信任问题 的陈述范围。
- `codex-rs/codex-mcp/src/tools.rs`：作为本页的直接证据路径，用来限定关于 工具与插件信任问题 的陈述范围。
- `codex-rs/codex-mcp/src/runtime.rs`：作为本页的直接证据路径，用来限定关于 工具与插件信任问题 的陈述范围。
- `codex-rs/rmcp-client/src/rmcp_client.rs`：作为本页的直接证据路径，用来限定关于 工具与插件信任问题 的陈述范围。
- `codex-rs/rmcp-client/src/stdio_server_launcher.rs`：作为本页的直接证据路径，用来限定关于 工具与插件信任问题 的陈述范围。
- `codex-rs/core/src/mcp.rs`：作为本页的直接证据路径，用来限定关于 工具与插件信任问题 的陈述范围。
- `codex-rs/core/src/mcp_tool_call.rs`：作为本页的直接证据路径，用来限定关于 工具与插件信任问题 的陈述范围。
- `derived-knowledge/raw/source-file-map.json`：把上述文件与图谱节点、符号名和主题用途连到一起，是当前输入包的证据索引。

## 待验证问题

- 哪些问题需要产品或维护者确认，哪些可以通过源码和测试直接关闭？
- 哪些判断会改变安全边界、用户承诺或文档表述，需要在 PR 前单独标注？
- 哪些问题只影响 wiki 粒度，可以延后到图谱生成后的 review 轮处理？

## Related

- [[tools/plugin-skill-loading]]
- [[tools/connector-identity-and-permissions]]
- [[security/supply-chain-and-plugin-risk]]
- [[tools/mcp-protocol-risk]]
- [[tc260/aia03-supply-chain-plugin-poisoning]]
