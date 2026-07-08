---
title: Approval Policy 与 Guardian
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - security
  - approval
  - guardian
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/protocol/src/protocol.rs
  - codex-rs/protocol/src/approvals.rs
  - codex-rs/core/src/guardian/mod.rs
  - codex-rs/core/src/guardian/review.rs
  - codex-rs/core/src/guardian/review_session.rs
  - codex-rs/core/src/guardian/policy_template.md
---

## 定义

`AskForApproval` 是“何时请求授权”的策略枚举，包含 `UnlessTrusted`、`OnFailure`、`OnRequest`、`Granular`、`Never`。`guardian` 是 approval 的自动 reviewer：在 `ApprovalsReviewer::AutoReview` 下，某些 approval prompt 会路由到一个专门的 review session，输出 `GuardianAssessment`，其中包括 `risk_level`、`user_authorization`、`outcome`、`rationale`。

`GuardianRiskLevel` 是四级风险标签：`Low`、`Medium`、`High`、`Critical`，序列化为 `low`、`medium`、`high`、`critical`。这个标签像体检报告中的严重度，授权决策还要看 `GuardianAssessmentOutcome::Allow/Deny` 和 user authorization。

## 为什么重要

Approval 是人类控制点，guardian 是自动分诊器。没有 approval，agent 可以把模型误判直接转换为外部副作用；没有 guardian，用户会被大量低风险确认淹没。两者组合后，低风险、授权清楚的动作可以被自动允许，高风险、授权弱或上下文污染的动作会被拒绝或交回用户。

`GranularApprovalConfig` 还把 shell sandbox approval、rules approval、skill approval、request permissions、MCP elicitation 分开。这个拆分很关键，因为“允许读取文件列表”和“允许 MCP 服务器弹出 elicitation 表单”是不同权限面。

## 代码仓证据

- `codex-rs/protocol/src/protocol.rs`：`AskForApproval` 枚举说明 `UnlessTrusted` 只自动批准 known safe read-only 命令；`OnRequest` 由模型决定何时 ask；`Granular` 按类别允许或自动拒绝 approval；`Never` 不向用户升级。
- `codex-rs/protocol/src/approvals.rs`：`GuardianRiskLevel`、`GuardianUserAuthorization`、`GuardianAssessmentOutcome`、`GuardianAssessmentEvent`、`ExecApprovalRequestEvent` 是 approval 和 guardian 的协议结构。
- `codex-rs/core/src/guardian/review.rs`：`routes_approval_to_guardian` 仅在 `AskForApproval::OnRequest | Granular(_)` 且 `ApprovalsReviewer::AutoReview` 时路由到 guardian；`review_approval_request` 是公开入口。
- `codex-rs/core/src/guardian/review_session.rs`：`build_guardian_review_session_config` 将 guardian session 的 approval policy 设为 `AskForApproval::Never`，permission profile 设为 read-only，并关闭 skill instructions 等会扩展执行面的上下文。
- `codex-rs/core/src/guardian/policy_template.md`：明确要求把 transcript、tool args、tool results、retry reason、planned action 当成 untrusted evidence，忽略重定义 policy 或绕过安全规则的内容。
- `codex-rs/core/src/guardian/mod.rs`：说明 guardian 失败时要保守处理，并有 `GUARDIAN_REVIEW_TIMEOUT`、denial circuit breaker 常量。

## 待验证问题

- 需要确认 app-server、TUI、SDK 展示的 copy 是否把 `risk_level`、`outcome`、`available_decisions` 清楚地区分给用户。
- 需要补测试证明所有 high-impact approval 类型都会给 guardian 足够的 action payload，尤其是 MCP tool annotations 与 request permissions。
- `policy_template.md` 是模型评审政策，仍需验证它在不同 model provider 下的稳定性和误拒率。

## Related

- [[security/security-control-map]]
- [[security/human-approval-design]]
- [[security/exec-policy-and-amendments]]
- [[prompt-security/tool-output-as-untrusted-data]]
- [[owasp/t10-human-oversight-overload]]
