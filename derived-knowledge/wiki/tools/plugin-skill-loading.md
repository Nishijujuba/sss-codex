---
title: "Plugin 与 Skill 加载"
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - "tools"
  - "plugins"
  - "skills"
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

Plugin 与 Skill 加载 位于 工具与 MCP 主题下，关注 MCP、插件、技能、connector 与工具调用生命周期。它把 index 中的规划条目落实为可被 `understand-knowledge` 解析的 wiki 页面，并把源码证据、概念解释和 Related 链接放在同一页内。

可以把本页看成从源码图谱到人工知识页的桥：源码文件提供事实边界，wikilink 提供概念边，正文负责解释二者之间的关系。若把页面集合视为 \(G=(V,E)\)，本页是一个 \(V\)，Related 链接是后续图谱构建会读取的 \(E\)。

## 为什么重要

这个主题重要，因为 MCP、插件、技能、connector 与工具调用生命周期 会影响后续页面如何解释 Codex 的长程执行、安全控制和工具边界。若这里的概念关系写错，后续 OWASP/TC260 映射会继承错误。

它还给阅读者提供“地图比例尺”：源码路径是街道，crate 或 API 是路口，wiki 概念是地标。比例尺清楚时，读者能知道一个判断来自具体实现、文档约定、测试证据，还是仍待验证的设计意图。

## 代码仓证据

- `codex-rs/codex-mcp/src/connection_manager.rs`：作为本页的直接证据路径，用来限定关于 Plugin 与 Skill 加载 的陈述范围。
- `codex-rs/codex-mcp/src/tools.rs`：作为本页的直接证据路径，用来限定关于 Plugin 与 Skill 加载 的陈述范围。
- `codex-rs/codex-mcp/src/runtime.rs`：作为本页的直接证据路径，用来限定关于 Plugin 与 Skill 加载 的陈述范围。
- `codex-rs/rmcp-client/src/rmcp_client.rs`：作为本页的直接证据路径，用来限定关于 Plugin 与 Skill 加载 的陈述范围。
- `codex-rs/rmcp-client/src/stdio_server_launcher.rs`：作为本页的直接证据路径，用来限定关于 Plugin 与 Skill 加载 的陈述范围。
- `codex-rs/core/src/mcp.rs`：作为本页的直接证据路径，用来限定关于 Plugin 与 Skill 加载 的陈述范围。
- `codex-rs/core/src/mcp_tool_call.rs`：作为本页的直接证据路径，用来限定关于 Plugin 与 Skill 加载 的陈述范围。
- `derived-knowledge/raw/source-file-map.json`：把上述文件与图谱节点、符号名和主题用途连到一起，是当前输入包的证据索引。

## 待验证问题

- 需要确认本页引用的源码路径在当前 commit 下仍覆盖完整行为，尤其是跨 crate 调用和 app-server 映射。
- 需要区分稳定机制、实验性 API、测试辅助代码和本地研究材料，避免把临时实现写成长期设计。
- 需要在正式图谱构建后检查本页的 wikilink 是否产生预期的隐式关系。

## Related

- [[security/supply-chain-and-plugin-risk]]
- [[prompt-security/instruction-hierarchy]]
- [[architecture/local-knowledge-overlay]]
- [[tools/connector-identity-and-permissions]]
- [[tc260/aia03-supply-chain-plugin-poisoning]]
