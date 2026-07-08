---
title: Sandbox Policy 模型
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - security
  - sandbox
  - runtime
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/protocol/src/protocol.rs
  - codex-rs/protocol/src/permissions.rs
  - codex-rs/sandboxing/src/manager.rs
  - codex-rs/core/src/exec.rs
  - codex-rs/windows-sandbox-rs/src/policy.rs
---

## 定义

`SandboxPolicy` 描述模型 shell 命令的执行限制，主要形态包括 `ReadOnly`、`WorkspaceWrite`、`DangerFullAccess` 和 `ExternalSandbox`。新 runtime 还使用 `FileSystemSandboxPolicy` 与 `NetworkSandboxPolicy` 拆分文件系统和网络语义，使“读、写、拒绝、平台默认、网络代理”能独立表达。

直观类比：`ReadOnly` 像图书馆阅览证；`WorkspaceWrite` 像只允许在当前项目工位写字；`DangerFullAccess` 像拿到整栋楼钥匙；`ExternalSandbox` 表示边界交给外部环境声明。

## 为什么重要

RCE 和工具滥用的损害上限，主要由 sandbox 和 permission profile 决定。Approval 能阻止部分动作进入执行阶段，sandbox 则负责在动作进入执行阶段后限制真实副作用。它是从“模型意图风险”到“宿主机实际风险”的最后几道硬边界之一。

`WorkspaceWrite` 的细节尤其容易误解：它允许读文件，并把写限制在 `cwd`、`writable_roots`、临时目录配置等范围内；`.git`、`.agents`、`.codex` 等 metadata 默认保留保护。数学上可看成写集合约束：\[
W_{effective}=W_{cwd}\cup W_{roots}\cup W_{tmp}-W_{protected}
\]

## 代码仓证据

- `codex-rs/protocol/src/protocol.rs`：`SandboxPolicy` 枚举定义 `danger-full-access`、`read-only`、`workspace-write`，并提供 `has_full_disk_write_access`、`has_full_network_access`、`get_writable_roots_with_cwd`。
- `codex-rs/protocol/src/permissions.rs`：`NetworkSandboxPolicy::{Restricted, Enabled}`；`FileSystemSandboxPolicy::workspace_write` 添加 project roots、tmp 可写项，并默认保护 `.git`、`.agents`、`.codex`。
- `codex-rs/protocol/src/permissions.rs`：`forbidden_agent_metadata_write` 和 `protected_metadata_names_for_writable_root` 处理 writable root 下 metadata 写保护。
- `codex-rs/sandboxing/src/manager.rs`：`SandboxType::{None, MacosSeatbelt, LinuxSeccomp, WindowsRestrictedToken}` 与 `SandboxManager::select_initial` 按平台和需求选择 sandbox。
- `codex-rs/core/src/exec.rs`：Windows restricted-token backend 对不能强制实现的文件系统/网络策略选择拒绝 unsandboxed 运行，并给出 `unsupported_windows_restricted_token_sandbox_reason`。
- `codex-rs/windows-sandbox-rs/src/policy.rs`：Windows sandbox parser 支持 `read-only`、`workspace-write`，拒绝 `danger-full-access` 与 `external-sandbox`。

## 待验证问题

- 需要分别验证 macOS Seatbelt、Linux Seccomp/Bubblewrap、Windows Restricted Token 对 split filesystem policy 的等价程度。
- `ExternalSandbox` 的真实边界来自宿主环境，代码中只能看到声明和兼容投影，不能直接证明外部 sandbox 强度。
- 需要补充对 network proxy、domain allow/deny 与 OS 网络边界的端到端测试证据。

## Related

- [[security/runtime-isolation-and-process-hardening]]
- [[security/security-control-map]]
- [[security/dangerous-command-intent-detection]]
- [[owasp/t11-remote-code-execution]]
- [[tc260/aia08-runtime-environment-risk]]
