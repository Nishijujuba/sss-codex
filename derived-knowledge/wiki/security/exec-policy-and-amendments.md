---
title: Exec Policy 与 Amendments
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - security
  - exec-policy
  - approvals
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/core/src/exec_policy.rs
  - codex-rs/core/src/session/mod.rs
  - codex-rs/protocol/src/approvals.rs
  - codex-rs/core/src/tools/sandboxing.rs
  - codex-rs/execpolicy-legacy/README.md
---

## 定义

`ExecPolicy` 是命令执行的规则层。它把命令 token 序列匹配到 `Decision::{Allow, Prompt, Forbidden}`，再由 `ExecPolicyManager` 转成 tool runtime 可执行的 `ExecApprovalRequirement::{Skip, NeedsApproval, Forbidden}`。`ExecPolicyAmendment` 是用户批准后可持久化的前缀规则，语义是把某个 command prefix 写入 allow policy。

`amendment` 像给未来开一条快速通道。它节省重复确认，也会带来 policy drift：如果 prefix 太宽，未来相似命令可能越过本应出现的提示。

## 为什么重要

审批系统只看单次动作会忘记历史。`ExecPolicy` 让用户或管理配置把“这一类命令以后如何处理”固化成规则。这个能力强，风险也强：它改变的是未来执行边界，影响范围大于当前 tool call。

`ExecPolicyManager` 在复杂解析路径上不自动派生 amendment，这个选择很合理。复杂 shell 的前缀常常比真实意图更粗，自动持久化等价于把不确定性写进长期 policy。

## 代码仓证据

- `codex-rs/core/src/exec_policy.rs`：`ExecPolicyManager::create_exec_approval_requirement_for_command` 加载当前 policy，评估 command list，并根据 `Decision` 生成 `Skip`、`NeedsApproval`、`Forbidden`。
- `codex-rs/core/src/exec_policy.rs`：`auto_amendment_allowed = !used_complex_parsing`，复杂 heredoc fallback 仍可匹配规则，但不会自动派生 amendment。
- `codex-rs/core/src/exec_policy.rs`：`try_derive_execpolicy_amendment_for_prompt_rules` 与 `try_derive_execpolicy_amendment_for_allow_rules` 将 heuristics prompt/allow 场景转为候选 prefix。
- `codex-rs/protocol/src/approvals.rs`：`ExecPolicyAmendment` 文档说明 `command` tokens 会作为 `prefix_rule(..., decision="allow")` 加入 execpolicy。
- `codex-rs/core/src/session/mod.rs`：`persist_execpolicy_amendment` 把 amendment 写入内存和磁盘；`record_execpolicy_amendment_message` 把已保存前缀注入上下文。
- `codex-rs/core/src/tools/sandboxing.rs`：`ExecApprovalRequirement::Skip { bypass_sandbox }` 可以影响 first attempt 的 sandbox 使用。
- `codex-rs/execpolicy-legacy/README.md`：说明 `.policy` 语言仍在演进，目标是表达足够安全的 allow 规则。

## 待验证问题

- 需要定位当前新旧 execpolicy 的配置文件路径、layer precedence 和迁移关系，避免把 legacy README 的描述当成当前完整语义。
- 需要检查 UI 是否在 `ApprovedExecpolicyAmendment` 中突出“未来相似命令”影响。
- 需要补充对 `prefix_rule` 过宽、shell wrapper、路径参数变体的安全测试。

## Related

- [[security/approval-policy-and-guardian]]
- [[security/dangerous-command-intent-detection]]
- [[security/human-approval-design]]
- [[security/tool-use-control-plane]]
- [[owasp/t2-tool-misuse]]
