---
title: 安全控制主链
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - security
  - control-plane
  - codex-rs
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/understand-graph-summary.json
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/core/src/tools/orchestrator.rs
  - codex-rs/core/src/exec_policy.rs
  - codex-rs/core/src/guardian/mod.rs
  - codex-rs/sandboxing/src/manager.rs
---

## 定义

Codex 的安全控制主链是一次动作从“用户意图”落到“宿主机执行”的约束路径：用户请求 -> agent 计划 -> tool call -> 命令解析 -> `ExecPolicyManager` -> approval -> `guardian` auto-review -> sandbox/runtime -> OS 边界 -> trace/audit。它像多道闸门串联的水渠：前一层降低误触概率，后一层限制真实副作用。

可以用一个粗略风险函数理解：\[
R \approx Capability \times Permission \times Uncertainty
\]
其中 `Capability` 是工具能力，`Permission` 是当前 permission profile/sandbox 范围，`Uncertainty` 来自不可信上下文、解析不完整、标准映射缺口和运行时平台差异。

## 为什么重要

单靠模型自律挡不住高危工具调用。Codex 的安全价值来自多层控制的组合：`AskForApproval` 决定何时要求授权，`ExecPolicy` 决定规则级放行/提示/拒绝，`guardian` 对可自动审查的 approval 做风险裁决，`SandboxPolicy` 和平台 sandbox 限制真实执行面，rollout trace 和 approval event 让事后能追溯。

关键边界：这些层的语义不同。`GuardianRiskLevel` 是风险标签；`Decision::Allow/Prompt/Forbidden` 是 exec policy 决策；`SandboxPolicy` 是执行环境约束；`ReviewDecision` 是用户或 reviewer 对具体 request 的回应。混成一类会导致错误威胁建模。

## 代码仓证据

- `codex-rs/core/src/tools/orchestrator.rs`：`ToolOrchestrator::run` 先计算 `ExecApprovalRequirement`，再做 approval/guardian，再选择 sandbox，最后执行 tool runtime。
- `codex-rs/core/src/exec_policy.rs`：`ExecPolicyManager::create_exec_approval_requirement_for_command` 结合 policy rules、safe/dangerous command heuristics、`AskForApproval`、sandbox 状态生成 `Skip`、`NeedsApproval` 或 `Forbidden`。
- `codex-rs/core/src/tools/sandboxing.rs`：`ExecApprovalRequirement` 与 `sandbox_override_for_first_attempt` 定义 first-attempt 是否跳过 sandbox。
- `codex-rs/core/src/guardian/mod.rs`：guardian 说明高层流程，包含 transcript 重建、严格 JSON 输出、失败保守处理、显式 allow/deny。
- `codex-rs/protocol/src/approvals.rs`：`ExecApprovalRequestEvent`、`GuardianAssessmentEvent`、`ReviewDecision`、`ExecPolicyAmendment` 给 approval、auto-review、policy amendment 提供结构化事件。
- `codex-rs/protocol/src/protocol.rs`：`AskForApproval`、`SandboxPolicy` 是权限和执行模式的协议层枚举。
- `codex-rs/sandboxing/src/manager.rs`：`SandboxManager::select_initial` 和 `transform` 按平台选择 `MacosSeatbelt`、`LinuxSeccomp`、`WindowsRestrictedToken` 或 `None`。
- `codex-rs/rollout-trace/README.md`：rollout trace 将 runtime 原始事件写入本地 bundle，再由 reducer 生成语义图。

## 待验证问题

- evidence 包未证明每个 product surface 都强制经过同一条主链；SDK、app-server、TUI、code-mode nested tool 的入口需要逐页补充路径级验证。
- `guardian` 的 policy 文本给出了评估准则，但是否覆盖所有 tool runtime 的审批路径需要基于测试矩阵验证。
- 本地 evidence 没有 OWASP/TC260 权威原文；跨标准页面只能把 index taxonomy 映射到 Codex 控制点。

## Related

- [[security/approval-policy-and-guardian]]
- [[security/sandbox-policy-model]]
- [[security/dangerous-command-intent-detection]]
- [[security/exec-policy-and-amendments]]
- [[security/auditability-and-forensics]]
