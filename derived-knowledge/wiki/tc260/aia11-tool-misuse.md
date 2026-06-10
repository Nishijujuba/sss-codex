---
title: TC260 AIA11 Tool Misuse
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - tc260
  - tools
  - access-control
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/core/src/tools/orchestrator.rs
  - codex-rs/core/src/tools/handlers/shell.rs
  - codex-rs/core/src/tools/handlers/mcp.rs
  - codex-rs/core/src/tools/handlers/tool_search_spec.rs
  - codex-rs/codex-mcp/src/connection_manager.rs
  - codex-rs/core/src/guardian/approval_request.rs
  - codex-rs/protocol/src/approvals.rs
---

## 定义

风险含义：AIA11 指工具细粒度访问控制不足、工具调用监测不足、指令过滤失效、动作范围过宽、频率限制缺失或日志留存不足。它和 OWASP T2 相近，但更强调控制面建设：谁能调用哪个工具、以什么参数、在什么频率和审计上下文中调用。

工具控制像门禁系统。工具名是门，参数是房间号，permission profile 是通行证，audit log 是进出记录。

## 为什么重要

Agent 的实际破坏力来自工具。没有细粒度控制，模型可以把一个模糊目标扩展成高权限调用；没有监测和日志，错误调用很难复盘；没有参数级约束，低风险工具也能被高风险参数改造成危险动作。

Codex 相关控制点包括：tool schema、tool_search deferred exposure、MCP tool filter、`ToolOrchestrator` approval/sandbox、guardian tool payload、approval decisions、network/session amendments、post/pre tool hooks。

## 代码仓证据

- `codex-rs/core/src/tools/handlers/tool_search_spec.rs`：`tool_search` 通过 BM25 搜索 deferred tool metadata，并把匹配工具暴露给下一次模型调用，提示 MCP 工具发现应走 `tool_search`。
- `codex-rs/core/src/tools/orchestrator.rs`：统一处理 approval、guardian、sandbox、network denial retry，是 tool runtime 的核心控制点。
- `codex-rs/core/src/tools/handlers/shell.rs`：shell handler 处理 `sandbox_permissions`、`additional_permissions`、`prefix_rule`，并拒绝不符合 approval policy 的显式 escalation。
- `codex-rs/core/src/tools/handlers/mcp.rs`：MCP handler 生成 tool spec、search info、pre/post tool hook payload，并调用 MCP backend。
- `codex-rs/codex-mcp/src/connection_manager.rs`：`call_tool` 在执行前检查 `tool_filter.allows(tool)`；manager 还保留 server origin、plugin provenance、`server_pollutes_memory`。
- `codex-rs/core/src/guardian/approval_request.rs`：`GuardianApprovalRequest::McpToolCall` 包含 server、tool_name、arguments、connector metadata、tool title/description、annotations。
- `codex-rs/protocol/src/approvals.rs`：`ExecApprovalRequestEvent` 与 `ReviewDecision` 为批准、拒绝、session approval 和 amendments 留下结构化记录。

## 待验证问题

- 缺口或待验证点：本地 evidence 没有 TC260 AIA11 权威原文，当前风险含义来自 index taxonomy。
- 需要确认工具调用频率限制、资源配额和批量调用限制是否存在统一实现。
- 需要验证 connector identity、user identity、agent identity 是否在 tool call audit 中完整关联。
- MCP server 提供的 tool annotations 可信度需要单独建模，不能把 server 自称 read-only 直接当安全事实。

## Related

- [[tools/tool-call-lifecycle]]
- [[tools/parameter-policy-and-abac]]
- [[tools/mcp-protocol-risk]]
- [[security/tool-use-control-plane]]
- [[owasp/t2-tool-misuse]]
