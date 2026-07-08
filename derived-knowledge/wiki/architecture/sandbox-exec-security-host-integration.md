---
title: Sandbox Exec Security Host Integration
type: architecture
created: 2026-06-01
updated: 2026-06-01
tags:
  - architecture
  - sandbox
  - exec-policy
  - security
  - host-integration
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/understand-graph-summary.json
  - derived-knowledge/raw/source-file-map.json
  - docs/sandbox.md
  - docs/execpolicy.md
  - codex-rs/protocol/src/protocol.rs
  - codex-rs/protocol/src/approvals.rs
  - codex-rs/protocol/src/models.rs
  - codex-rs/protocol/src/permissions.rs
  - codex-rs/core/src/exec_policy.rs
  - codex-rs/execpolicy/src/policy.rs
  - codex-rs/sandboxing/src/manager.rs
  - codex-rs/process-hardening/src/lib.rs
---

## 定义

Sandbox/exec/security/host integration 是 Codex 把“模型想执行动作”变成“宿主机上可控进程”的安全管线。它横跨 command parsing、execpolicy、approval policy、guardian review、permission profile、sandbox transform、平台 sandbox、process hardening、telemetry/audit。

一条最小链路可以写成：

\[
command \rightarrow parsed\_commands \rightarrow execpolicy \rightarrow approval/guardian \rightarrow permission\_profile \rightarrow sandbox\_transform \rightarrow host\_process
\]

其中 `approval` 是人或 auto-review 的决策口，`execpolicy` 是规则表和 heuristic fallback，`guardian` 是风险审查层，`sandbox` 是 OS/平台执行边界。它们是多层控制，不能互相替代。

## 为什么重要

安全边界最容易被一句“需要运行命令”压扁。实际系统里，命令能否执行取决于多个条件：命令是否匹配 known-safe 或 dangerous heuristic，当前 `AskForApproval` 是 `UnlessTrusted`、`OnRequest`、`Granular` 还是 `Never`，是否请求 `require_escalated` 或 `with_additional_permissions`，当前 `PermissionProfile` 是 `Managed`、`Disabled` 还是 `External`，平台能否提供 Seatbelt、bubblewrap/Landlock 或 Windows sandbox。

一个直观类比：`execpolicy` 像门禁规则表，`approval` 像临时通行证，`guardian` 像风险复核员，`sandbox` 像物理围栏，`process-hardening` 像加固门窗。只有把这些层的输入输出分清，wiki 才能准确说明安全保证的边界。

## 代码仓证据

- `codex-rs/protocol/src/protocol.rs`: `AskForApproval` 变体包括 `UnlessTrusted`、`OnFailure`、`OnRequest`、`Granular(GranularApprovalConfig)`、`Never`；`SandboxPolicy` 包含 `DangerFullAccess`、`ReadOnly`、`ExternalSandbox`、`WorkspaceWrite`；`ReviewDecision` 包含 command approval、execpolicy amendment、session approval、network policy amendment、denial。
- `codex-rs/protocol/src/config_types.rs`: `SandboxMode` 包含 `ReadOnly`、`WorkspaceWrite`、`DangerFullAccess`；`ApprovalsReviewer` 包含 `User` 与 `AutoReview`，并接受 legacy `guardian_subagent`。
- `codex-rs/protocol/src/approvals.rs`: `ExecPolicyAmendment` 表示可持久化的 command prefix；`GuardianRiskLevel` 为 `Low`、`Medium`、`High`、`Critical`；`ExecApprovalRequestEvent` 携带 `turn_id`、`command`、`cwd`、`network_approval_context`、`proposed_execpolicy_amendment`、`additional_permissions`、`available_decisions`、`parsed_cmd`。
- `codex-rs/protocol/src/models.rs`: `SandboxPermissions` 包含 `UseDefault`、`RequireEscalated`、`WithAdditionalPermissions`；`PermissionProfile` 包含 `Managed`、`Disabled`、`External`；`AdditionalPermissionProfile` 承载 per-command/session grant 的 network/file_system overlay。
- `codex-rs/protocol/src/permissions.rs`: `NetworkSandboxPolicy::{Restricted, Enabled}`、`FileSystemSandboxKind::{Restricted, Unrestricted, ExternalSandbox}`、`FileSystemSandboxPolicy` 定义 filesystem/network enforcement shape。
- `codex-rs/core/src/exec_policy.rs`: `ExecPolicyManager::create_exec_approval_requirement_for_command` 使用 `commands_for_exec_policy`、`Policy::check_multiple_with_options`、`derive_requested_execpolicy_amendment_from_prefix_rule`，并在 fallback 中调用 `command_might_be_dangerous`。
- `codex-rs/execpolicy/src/decision.rs`: `Decision::{Allow, Prompt, Forbidden}` 是 execpolicy 决策的三值模型。
- `codex-rs/execpolicy/src/policy.rs`: `Policy::get_allowed_prefixes`、`add_prefix_rule`、`check_multiple_with_options` 说明 prefix rule 与多命令聚合检查。
- `codex-rs/shell-command/src/parse_command.rs`: `parse_command` / `parse_command_impl` 将 shell command 分解成 `ParsedCommand`。
- `codex-rs/shell-command/src/command_safety/is_safe_command.rs` 与 `is_dangerous_command.rs`: 分别提供 known-safe 与 dangerous command heuristics；Windows 还有 `windows_safe_commands.rs`、`windows_dangerous_commands.rs`。
- `codex-rs/shell-escalation/src/unix/escalation_policy.rs`: `EscalationPolicy` trait 为 sandboxed shell 内的 execve escalation 提供决策接口。
- `codex-rs/core/src/guardian/policy_template.md`: 要求先分配 `risk_level` 与 `user_authorization`，再派生 outcome；`risk_level = "critical"` 时 deny。
- `codex-rs/sandboxing/src/manager.rs`: `SandboxManager::select_initial`、`transform`、`get_platform_sandbox`、`compatibility_sandbox_policy_for_permission_profile` 将 permission profile 转成平台执行。
- `codex-rs/sandboxing/src/seatbelt.rs`: 使用 `/usr/bin/sandbox-exec`，构造 macOS Seatbelt policy。
- `codex-rs/sandboxing/src/landlock.rs` 与 `bwrap.rs`: Linux 路径含 bubblewrap/Landlock 支持检查和 command args 构造。
- `codex-rs/windows-sandbox-rs/src/policy.rs`、`process.rs`、`audit.rs`: Windows sandbox policy parse、process spawn、world-writable scan/deny。
- `codex-rs/process-hardening/src/lib.rs`: `pre_main_hardening`、`disable_process_dumping`、platform-specific hardening 函数。

## 待验证问题

- `docs/sandbox.md` 当前只指向外部官方安全文档；本地源码能证明实现形状，最终用户承诺仍需外部 docs 或 product policy 复核。
- `guardian` 是 risk review 层，`execpolicy` 是 command authorization 规则层；二者具体组合顺序和失败行为需要通过 approval tests 与 app-server approval flow 继续补证。
- Windows sandbox setup 与 buffered execution 在 app-server README 中有 unsupported 条件；这些限制需要在 Windows-specific 页面展开。
- `process/spawn` 在 app-server README 中明确为 unsandboxed experimental host process API；它与 `command/exec` 的边界需要安全页单独核对。
- `AskForApproval::OnFailure` 被源码注释标为 deprecated，迁移策略和外部兼容要求仍需 human review。

## Related

- [[security/security-control-map]]
- [[security/approval-policy-and-guardian]]
- [[security/sandbox-policy-model]]
- [[security/dangerous-command-intent-detection]]
- [[security/exec-policy-and-amendments]]
- [[security/runtime-isolation-and-process-hardening]]
