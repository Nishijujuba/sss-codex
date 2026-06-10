---
title: 危险命令意图识别
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - security
  - shell
  - command-safety
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/core/src/exec_policy.rs
  - codex-rs/shell-command/src/command_safety/is_dangerous_command.rs
  - codex-rs/shell-command/src/command_safety/is_safe_command.rs
  - codex-rs/shell-command/src/parse_command.rs
  - codex-rs/core/src/tools/handlers/shell_spec.rs
---

## 定义

危险命令意图识别是把 argv 或 shell wrapper 内部脚本转成安全判断的过程。它包含两类判断：`is_known_safe_command` 识别窄范围只读命令；`command_might_be_dangerous` 识别明显破坏性命令。中间的大量命令进入 approval/sandbox 组合路径。

这类判断不能停留在简单字符串黑名单。命令可以经过 `bash -lc`、PowerShell `-Command`、shell control operator、prefix rule、heredoc fallback、全局 git option 等多层包装。一个安全判断函数要回答的是“这一串 token 的实际副作用大概是什么”。

## 为什么重要

命令解析是 shell 安全的薄冰层。过宽的 safelist 会让危险动作绕过 approval；过窄的 safelist 会把普通读操作全部推给用户，制造 approval fatigue。Codex 采用保守白名单和危险启发式的组合，降低误放行代价。

可以把命令安全拆成集合关系：\[
Command = Program + Args + ShellExpansion + Environment
\]
当前代码主要证明了 `Program + Args` 与部分 shell lowering 的处理；`ShellExpansion` 和环境依赖仍是高不确定区域。

## 代码仓证据

- `codex-rs/core/src/exec_policy.rs`：`commands_for_exec_policy` 会从 `bash -lc`、PowerShell wrapper 中提取 plain commands；复杂解析命中时禁止自动生成 amendment。
- `codex-rs/core/src/exec_policy.rs`：`render_decision_for_unmatched_command` 调用 `is_known_safe_command` 和 `command_might_be_dangerous`，对 Windows read-only sandbox 做特殊处理。
- `codex-rs/shell-command/src/command_safety/is_safe_command.rs`：`is_known_safe_command` 对 `cat`、`rg`、`git status/log/diff/show/branch` 等读类命令做白名单，并排除 `find -exec/-delete`、`rg --pre`、`base64 --output` 等副作用选项。
- `codex-rs/shell-command/src/command_safety/is_dangerous_command.rs`：`command_might_be_dangerous` 识别 `rm -f`、`rm -rf`、`sudo <cmd>`，并支持 `bash -lc` plain command 序列。
- `codex-rs/shell-command/src/parse_command.rs`：`parse_command` 为 approval 展示提供 best-effort `ParsedCommand`，未知复杂命令会折叠为 `Unknown`。
- `codex-rs/core/src/tools/handlers/shell_spec.rs`：tool schema 暴露 `sandbox_permissions`、`justification`、`prefix_rule`，并在 Windows guidance 中要求跨 shell 删除/移动前做路径校验。

## 待验证问题

- 需要验证 PowerShell dangerous/safe 规则在 Windows 上的测试覆盖，尤其是 `Remove-Item`、通配符、管道和字符串拼接。
- shell expansion、环境变量、alias、profile script 对真实意图的影响无法从当前 evidence 完整证明。
- 需要审计 prefix rule 的用户可读 copy，避免用户把过宽前缀永久批准。

## Related

- [[security/exec-policy-and-amendments]]
- [[security/sandbox-policy-model]]
- [[security/human-approval-design]]
- [[owasp/t2-tool-misuse]]
- [[owasp/t11-remote-code-execution]]
