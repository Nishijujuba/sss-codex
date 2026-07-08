---
title: OWASP T11 Remote Code Execution
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - owasp
  - rce
  - sandbox
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/core/src/exec.rs
  - codex-rs/core/src/tools/orchestrator.rs
  - codex-rs/core/src/tools/sandboxing.rs
  - codex-rs/sandboxing/src/manager.rs
  - codex-rs/process-hardening/README.md
  - codex-rs/windows-sandbox-rs/src/policy.rs
---

## 定义

风险含义：T11 Remote Code Execution 指 agent 或被 agent 调用的工具执行了攻击者控制的代码，进而访问文件、网络、凭据或进程资源。Codex 的相关入口包括 shell/unified exec、dependency install script、build script、generated script、MCP stdio server、plugin install、code-mode nested tool 和 apply_patch 后运行的代码。

这里的“remote”可以来自远程内容，也可以来自本地仓库中被远程提交污染的文件。关键条件是代码来源不可信，执行环境具备足够权限。

## 为什么重要

RCE 是能力跃迁：文本变成进程，进程可以读写文件、发网络、派生子进程。Codex 的主要控制点是先降低执行概率，再降低执行权限，再保留证据。若 sandbox 关闭且 approval 被绕过，风险函数里的 `Capability` 和 `Permission` 同时升高。

Codex 相关控制点包括：`ExecPolicy`、dangerous command heuristic、approval/guardian、`SandboxManager`、Windows refusal paths、process hardening、retained output cap、network proxy/approval。

## 代码仓证据

- `codex-rs/core/src/tools/orchestrator.rs`：执行前先做 `ExecApprovalRequirement` 和 sandbox selection，sandbox denial 后才进入可能的 escalation/approval path。
- `codex-rs/core/src/tools/sandboxing.rs`：`sandbox_override_for_first_attempt` 规定 `RequireEscalated` 或 trusted execpolicy allow 何时跳过 sandbox。
- `codex-rs/core/src/exec.rs`：`exec_windows_sandbox`、`should_use_windows_restricted_token_sandbox`、`unsupported_windows_restricted_token_sandbox_reason` 处理 Windows sandbox 限制，无法安全执行时拒绝 unsandboxed。
- `codex-rs/sandboxing/src/manager.rs`：`SandboxManager::transform` 将 command 包装到 macOS Seatbelt、Linux sandbox 或 Windows restricted token。
- `codex-rs/process-hardening/README.md`：`pre_main_hardening()` 设计用于禁用 core dumps、禁用 ptrace attach、移除 `LD_PRELOAD`、`DYLD_*` 等危险环境变量。
- `codex-rs/windows-sandbox-rs/src/policy.rs`：Windows sandbox policy 明确拒绝 `DangerFullAccess` 和 `ExternalSandbox`。

## 待验证问题

- 缺口或待验证点：本地 evidence 没有 OWASP T11 权威原文，当前风险含义来自 index taxonomy。
- 需要补充 dependency install、plugin install、MCP stdio server 启动链路的 RCE 专页。
- 需要验证 sandbox 对网络代理、环境变量、Windows elevated backend、WSL1/Bubblewrap 的实际防护边界。
- 需要明确 code-mode nested exec 是否具有与普通 shell 一致的 approval 和 trace 控制。

## Related

- [[security/sandbox-policy-model]]
- [[security/runtime-isolation-and-process-hardening]]
- [[security/dangerous-command-intent-detection]]
- [[security/supply-chain-and-plugin-risk]]
- [[tc260/aia08-runtime-environment-risk]]
