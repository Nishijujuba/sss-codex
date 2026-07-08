---
title: "PreCompact and PostCompact Hooks"
type: "wiki"
created: "2026-06-01"
updated: "2026-06-01"
tags:
  - long-horizon
  - hooks
  - compaction
  - lifecycle
  - audit
sources:
  - "derived-knowledge/index.md"
  - "derived-knowledge/raw/understand-graph-summary.json"
  - "derived-knowledge/raw/source-file-map.json"
  - "codex-rs/config/src/hook_config.rs"
  - "codex-rs/core/src/compact.rs"
  - "codex-rs/core/src/hook_runtime.rs"
  - "codex-rs/hooks/src/events/compact.rs"
---

## 定义

`PreCompact` 和 `PostCompact` 是 compaction 生命周期两侧的 hook。`PreCompact` 在压缩历史前运行，能够用 `continue: false` 停止压缩；`PostCompact` 在压缩成功后运行，也能让本轮在压缩后停止。两者的请求字段相近：`session_id`、`turn_id`、`subagent`、`cwd`、`transcript_path`、`model`、`trigger`。

这两个 hook 像“压缩前验货”和“压缩后盖章”。前者可以在历史被改写前抓取状态、检查策略或要求停止；后者可以在 replacement history 已经生成后做审计、同步外部记录或暂停后续流程。

`trigger` 是 matcher 的关键输入，当前 hook runtime 把 `CompactionTrigger` 映射为字符串，例如 `manual` 或 `auto`。因此 hook 配置可以按触发来源分流。

## 为什么重要

compaction 是长程任务里的高风险状态转折点。它会把详细历史换成摘要和精选消息，信息形状发生变化。生命周期 hook 给系统一个可插入的边界：在 \(H \rightarrow H'\) 发生前后，外部策略可以观察、记录、暂停。

安全意义也很直接。若 memory、审计、企业策略或调试工具依赖原始历史，`PreCompact` 是最后一个能看到压缩前状态的生命周期入口；`PostCompact` 是第一个能看到压缩已经完成的入口。没有这两个边界，压缩就像在黑箱里重排证据。

## 代码仓证据

- `codex-rs/config/src/hook_config.rs`：`HookEventsToml` 用 `#[serde(rename = "PreCompact")] pub pre_compact` 和 `#[serde(rename = "PostCompact")] pub post_compact` 暴露配置项。
- `codex-rs/config/src/hook_config.rs`：`into_matcher_groups()` 把 `pre_compact` 映射到 `HookEventName::PreCompact`，把 `post_compact` 映射到 `HookEventName::PostCompact`。
- `codex-rs/core/src/compact.rs`：`run_compact_task_inner()` 在真正 compact 前调用 `run_pre_compact_hooks()`；若 `PreCompactHookOutcome::Stopped`，记录 `CompactionStatus::Interrupted` 并返回 `CodexErr::TurnAborted`。
- `codex-rs/core/src/compact.rs`：compact 成功后调用 `run_post_compact_hooks()`；若 `PostCompactHookOutcome::Stopped`，同样返回 `CodexErr::TurnAborted`。
- `codex-rs/core/src/hook_runtime.rs`：`run_pre_compact_hooks()` 构造 `codex_hooks::PreCompactRequest`，字段包括 `session_id`、`turn_id`、`subagent`、`cwd`、`transcript_path`、`model`、`trigger`。
- `codex-rs/core/src/hook_runtime.rs`：`run_post_compact_hooks()` 构造 `PostCompactRequest`，并发送 `HookStarted` / `HookCompleted` 事件。
- `codex-rs/hooks/src/events/compact.rs`：`pre_command_input_json()` 序列化 `hook_event_name: "PreCompact"`；`post_command_input_json()` 序列化 `hook_event_name: "PostCompact"`。
- `codex-rs/hooks/src/events/compact.rs`：测试 `pre_compact_input_includes_lifecycle_metadata` 和 `post_compact_input_includes_lifecycle_metadata` 验证 hook 输入包含 lifecycle metadata。
- `codex-rs/hooks/src/events/compact.rs`：测试 `continue_false_stops_before_compaction` 与 `post_compact_continue_false_stops_after_compaction` 验证 `continue: false` 的停止语义。
- `codex-rs/hooks/src/events/compact.rs`：测试 `block_decision_is_not_supported_for_pre_compact` 表明 `decision: "block"` 这种输出形状对 `PreCompact` 无效。

## 待验证问题

- hook 能观察到哪些 transcript 内容、是否含敏感信息、是否经过脱敏，当前页面没有完整证明。
- `PostCompact` 停止后，replacement history 已经写入；这对 UI、resume 和 audit 的最终状态如何呈现，需要端到端测试确认。
- `PreCompact` 对 plain stdout 的处理、JSON schema 的完整约束、hook 错误和用户可见 warning 之间的关系还需要读 output parser 与 dispatcher。
- hooks 是否可作为企业安全边界，还是仅作为可配置生命周期扩展，需要产品和安全设计文档确认。

## Related

- [[long-horizon/context-compaction-flow]]
- [[prompt-security/repo-instruction-boundaries]]
- [[security/auditability-and-forensics]]
- [[tools/plugin-skill-loading]]
- [[long-horizon/tool-feedback-loop]]
