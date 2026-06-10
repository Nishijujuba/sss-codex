---
title: OWASP T2 Tool Misuse
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - owasp
  - tools
  - misuse
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/core/src/tools/orchestrator.rs
  - codex-rs/core/src/tools/handlers/shell.rs
  - codex-rs/core/src/tools/handlers/mcp.rs
  - codex-rs/codex-mcp/src/connection_manager.rs
  - codex-rs/core/src/guardian/approval_request.rs
  - codex-rs/protocol/src/approvals.rs
---

## 定义

风险含义：T2 Tool Misuse 指 agent 以错误参数、错误目标、越权范围或被注入的目标调用工具，造成删除、泄露、越权访问、错误外部请求或持续 policy 放宽。Codex 中的高风险工具面包括 shell/unified exec、apply_patch、MCP tool call、dynamic tool、network approval、request permissions、browser/connector 类工具。

工具像机械臂：模型语言只是指令，工具调用才会碰到真实世界。参数边界、approval、sandbox、provenance 和 audit 是机械臂周围的护栏。

## 为什么重要

Tool misuse 常常不需要模型“恶意”，只需要目标解析错、路径错、来源错或用户授权范围错。它与 prompt injection、RCE、human oversight overload 互相放大：注入负责改目标，工具负责执行，低质量 approval 负责放行。

Codex 相关控制点包括：tool spec 限定 schema、`ToolOrchestrator` 统一 approval/sandbox 流程、MCP disabled-tool filter、guardian action serialization、`ReviewDecision`、session approval cache、prefix/network amendments。

## 代码仓证据

- `codex-rs/core/src/tools/orchestrator.rs`：tool runtime 执行前处理 approval requirement、guardian review、sandbox selection、network approval 和 retry。
- `codex-rs/core/src/tools/handlers/shell.rs`：shell handler 校验 approval policy、additional permissions、`prefix_rule`，再调用 `ExecPolicyManager` 生成 exec approval requirement。
- `codex-rs/core/src/tools/handlers/mcp.rs`：`McpHandler` 把 MCP tool spec 转为 model-visible tool，并在 handle 中调用 `handle_mcp_tool_call`。
- `codex-rs/codex-mcp/src/connection_manager.rs`：`call_tool` 会检查 `tool_filter.allows(tool)`，不允许 disabled tool 执行。
- `codex-rs/core/src/guardian/approval_request.rs`：`GuardianApprovalRequest` 覆盖 `Shell`、`ExecCommand`、`ApplyPatch`、`NetworkAccess`、`McpToolCall`、`RequestPermissions` 等 action payload。
- `codex-rs/protocol/src/approvals.rs`：`ReviewDecision` 支持 approved、approved for session、execpolicy amendment、network policy amendment、abort 等决策形态。

## 待验证问题

- 缺口或待验证点：本地 evidence 没有 OWASP T2 权威原文，当前风险含义来自 index taxonomy。
- 需要确认所有 plugin/connector tool 是否都经过同一 `ToolOrchestrator` 或等价控制路径。
- 需要验证 MCP tool annotations 的可信来源，尤其是 `read_only_hint`、`destructive_hint`、`open_world_hint` 是否可被恶意 server 伪造。
- 需要补充跨工具频率限制和资源范围限制证据。

## Related

- [[tools/tool-call-lifecycle]]
- [[tools/mcp-connection-manager]]
- [[security/tool-use-control-plane]]
- [[security/exec-policy-and-amendments]]
- [[tc260/aia11-tool-misuse]]
