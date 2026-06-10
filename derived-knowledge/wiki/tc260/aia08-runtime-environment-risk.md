---
title: TC260 AIA08 Runtime Environment Risk
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - tc260
  - runtime
  - sandbox
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/sandboxing/src/manager.rs
  - codex-rs/core/src/exec.rs
  - codex-rs/protocol/src/permissions.rs
  - codex-rs/windows-sandbox-rs/src/policy.rs
  - codex-rs/process-hardening/README.md
---

## 定义

风险含义：AIA08 Runtime Environment Risk 指容器逃逸、sandbox bypass、side channel、脚本监控缺失、高权限代码执行等运行环境问题。对 Codex 来说，核心是 shell/tool 进程在本机、远端 workspace、Windows/macOS/Linux sandbox、network proxy 与 permission profile 下的真实边界。

运行环境像舞台。脚本是演员，sandbox 是围栏，权限 profile 是演员能进入的区域。围栏薄弱时，模型层的谨慎无法弥补真实执行面的外溢。

## 为什么重要

Runtime risk 直接决定 RCE 或 tool misuse 的 blast radius。即便 approval 正确，执行环境如果无法强制限制文件系统、网络或进程能力，授权范围也会被底层实现放大。

Codex 相关控制点包括：`SandboxType` 平台选择、`FileSystemSandboxPolicy` split permission、network restricted/enabled、Windows backend refusal、process hardening、direct runtime enforcement 判断。

## 代码仓证据

- `codex-rs/sandboxing/src/manager.rs`：`SandboxType` 覆盖 `None`、`MacosSeatbelt`、`LinuxSeccomp`、`WindowsRestrictedToken`；`get_platform_sandbox` 按平台和 Windows 开关选择实现。
- `codex-rs/sandboxing/src/manager.rs`：`SandboxManager::select_initial` 结合 filesystem policy、network policy、preference 和 managed network requirements 决定是否需要平台 sandbox。
- `codex-rs/protocol/src/permissions.rs`：`FileSystemSandboxPolicy::needs_direct_runtime_enforcement` 检查 split policy 与 legacy projection 的语义差异。
- `codex-rs/core/src/exec.rs`：Windows restricted/elevated backend 对无法强制的策略返回错误，文本包含 “refusing to run unsandboxed”。
- `codex-rs/windows-sandbox-rs/src/policy.rs`：Windows sandbox parser 只接受 `read-only`、`workspace-write`，拒绝 `danger-full-access`、`external-sandbox`。
- `codex-rs/process-hardening/README.md`：`pre_main_hardening()` 禁用 core dumps、ptrace attach，并移除危险环境变量。

## 待验证问题

- 缺口或待验证点：本地 evidence 没有 TC260 AIA08 权威原文，当前风险含义来自 index taxonomy。
- 需要验证各平台 sandbox 的系统调用、文件 ACL、网络代理和子进程继承行为。
- 需要审计 remote workspace、Docker、WSL、Windows elevated backend 与 private desktop 的组合风险。
- side-channel 控制、资源 quota、脚本行为监控尚未从当前源码证据完整证明。

## Related

- [[security/sandbox-policy-model]]
- [[security/runtime-isolation-and-process-hardening]]
- [[owasp/t11-remote-code-execution]]
- [[security/dangerous-command-intent-detection]]
- [[questions/security-guarantee-boundaries]]
