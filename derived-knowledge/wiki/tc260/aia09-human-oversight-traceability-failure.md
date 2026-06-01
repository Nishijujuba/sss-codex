---
title: TC260 AIA09 Human Oversight and Traceability Failure
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - tc260
  - traceability
  - human-oversight
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/protocol/src/approvals.rs
  - codex-rs/app-server-protocol/src/protocol/v2/item.rs
  - codex-rs/app-server-protocol/src/protocol/v2/permissions.rs
  - codex-rs/rollout-trace/README.md
  - codex-rs/rollout-trace/src/raw_event.rs
  - codex-rs/core/src/session/mod.rs
---

## 定义

风险含义：AIA09 指人类监督失效和可追溯性失败，包括 approval 信息不足、决策不可复盘、日志缺字段、工具调用与用户授权断链、事后无法判断是谁在何时批准了什么。Codex 中相关对象包括 `ExecApprovalRequestEvent`、`GuardianAssessmentEvent`、app-server v2 approval params、rollout trace bundle 和 memory citation。

监督像飞行记录仪加驾驶舱确认。没有清楚的 request payload，用户会盲批；没有 raw trace，事故后只能猜。

## 为什么重要

Agent 安全不能只依赖预防。复杂工具链必然会出现误判、误拒、误批和失败 retry。可追溯性让系统能回答：用户授权了哪个 action？guardian 如何评估？哪个 tool call 执行？输出是否进入模型上下文？这决定了事故复盘和治理改进的质量。

Codex 相关控制点包括：approval event 字段、guardian status/rationale、available decisions、rollout trace raw event spine、payload refs、local bundle privacy boundary。

## 代码仓证据

- `codex-rs/protocol/src/approvals.rs`：`ExecApprovalRequestEvent` 记录 `call_id`、`approval_id`、`turn_id`、`started_at_ms`、`command`、`cwd`、reason、network context、amendments、additional permissions、available decisions、parsed command。
- `codex-rs/protocol/src/approvals.rs`：`GuardianAssessmentEvent` 记录 review id、target item、turn id、started/completed time、status、risk level、user authorization、rationale、decision source、canonical action。
- `codex-rs/app-server-protocol/src/protocol/v2/item.rs`：`CommandExecutionRequestApprovalParams` 将 approval payload 映射到 desktop/app-server v2，包括 command actions 和 proposed amendments。
- `codex-rs/app-server-protocol/src/protocol/v2/permissions.rs`：`PermissionsRequestApprovalParams`、`PermissionsRequestApprovalResponse` 记录 request permissions 的 cwd、reason、permissions、scope、strict auto-review。
- `codex-rs/rollout-trace/README.md`：rollout trace 是 opt-in local diagnostic，保存 prompt、response、tool input/output、terminal output、paths 等敏感证据。
- `codex-rs/rollout-trace/src/raw_event.rs`：`RawTraceEvent` 包含 schema version、seq、timestamp、rollout id、thread id、turn id、typed payload；`RawTraceEventPayload` 覆盖 inference、tool call、MCP correlation、runtime start/end。

## 待验证问题

- 缺口或待验证点：本地 evidence 没有 TC260 AIA09 权威原文，当前风险含义来自 index taxonomy。
- rollout trace 是 opt-in，需要确认默认运行时日志是否足够支持常规审计。
- 需要验证 app-server/TUI 是否显示 proposed amendments 的长期影响和 `available_decisions` 的差异。
- 需要确认 approval、guardian、trace、memory citation 之间是否存在统一 correlation id。

## Related

- [[security/auditability-and-forensics]]
- [[security/human-approval-design]]
- [[long-horizon/rollout-trace-and-resume]]
- [[owasp/t8-repudiation-and-nontraceability]]
- [[security/approval-policy-and-guardian]]
