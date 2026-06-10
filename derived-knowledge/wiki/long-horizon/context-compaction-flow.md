---
title: "Context Compaction Flow"
type: "wiki"
created: "2026-06-01"
updated: "2026-06-01"
tags:
  - long-horizon
  - compaction
  - context-window
  - resume
  - token-budget
sources:
  - "derived-knowledge/index.md"
  - "derived-knowledge/raw/understand-graph-summary.json"
  - "derived-knowledge/raw/source-file-map.json"
  - "codex-rs/core/src/compact.rs"
  - "codex-rs/core/src/session/turn.rs"
  - "codex-rs/core/src/session/rollout_reconstruction.rs"
  - "codex-rs/protocol/src/protocol.rs"
  - "codex-rs/app-server-protocol/src/protocol/v2/thread.rs"
---

## 定义

Context compaction 是把长历史压成较短 replacement history 的流程。它保留一段摘要、有限数量的用户消息，并在某些模式下注入 canonical initial context。形式上可以写成：

\[
H' = C(H, U, S, K)
\]

其中 \(H\) 是原历史，\(U\) 是可保留的用户消息集合，\(S\) 是模型生成的摘要，\(K\) 是是否注入 initial context 的策略。`InitialContextInjection::DoNotInject` 用于 pre-turn/manual compaction；`InitialContextInjection::BeforeLastUserMessage` 用于 mid-turn compaction。

源码里有三条路径：用户触发的 manual compact、pre-turn 自动 compact、mid-turn 自动 compact。pre-turn 的目标是在新一轮采样前把历史压低；mid-turn 的目标是在模型还需要 follow-up 或还有 pending input 时，让同一轮工作继续运行。

## 为什么重要

长程任务的上下文窗口像背包，工具输出、源码片段、推理草稿都会占容量。compaction 相当于把一堆物品压成一张清单和少量必备原件。它能延长任务寿命，但会引入信息损失：摘要可能漏掉精确路径、错误码、审批条件、用户限制。

`build_compacted_history_with_limit()` 只保留最多 `COMPACT_USER_MESSAGE_MAX_TOKENS` 的用户消息，并可能对最旧的可选消息做 token 截断。这个机制对长线程很现实：它保护最近交互和摘要，牺牲部分原始上下文。代码还在 compact 完成后给用户发送 warning，明确提示长线程和多次 compaction 会降低模型准确性。

## 代码仓证据

- `codex-rs/core/src/compact.rs`：`SUMMARIZATION_PROMPT`、`SUMMARY_PREFIX`、`COMPACT_USER_MESSAGE_MAX_TOKENS` 定义 compaction 的提示与用户消息保留上限。
- `codex-rs/core/src/compact.rs`：`InitialContextInjection` 注释区分 `DoNotInject` 和 `BeforeLastUserMessage`，说明 pre-turn/manual 与 mid-turn 的 replacement history 形状不同。
- `codex-rs/core/src/compact.rs`：`run_inline_auto_compact_task()` 使用 `CompactionTrigger::Auto`；`run_compact_task()` 使用 `CompactionTrigger::Manual`、`CompactionReason::UserRequested`、`CompactionPhase::StandaloneTurn`。
- `codex-rs/core/src/compact.rs`：`run_compact_task_inner()` 先运行 `run_pre_compact_hooks()`，再执行 `run_compact_task_inner_impl()`，成功后运行 `run_post_compact_hooks()`。
- `codex-rs/core/src/compact.rs`：`run_compact_task_inner_impl()` 创建 `TurnItem::ContextCompaction`，clone history，采样摘要，构造 `CompactedItem { message, replacement_history }`，调用 `replace_compacted_history()`，再 recompute token usage。
- `codex-rs/core/src/compact.rs`：`build_compacted_history_with_limit()` 从后往前挑选用户消息，超出 token 预算时调用 `truncate_text()`。
- `codex-rs/core/src/session/turn.rs`：`auto_compact_token_status()` 计算 `active_context_tokens`、`auto_compact_scope_tokens`、`auto_compact_scope_limit`、`full_context_window_limit_reached`、`token_limit_reached`。
- `codex-rs/core/src/session/turn.rs`：`run_pre_sampling_compact()` 在 token limit reached 时以 `CompactionPhase::PreTurn` 执行 auto compact。
- `codex-rs/core/src/session/turn.rs`：采样循环中，若 `token_limit_reached && needs_follow_up`，以 `CompactionPhase::MidTurn` 调用 `run_auto_compact()` 并继续本轮。
- `codex-rs/protocol/src/protocol.rs`：`EventMsg::ContextCompacted` 和 `ContextCompactedEvent` 是协议层事件。
- `codex-rs/app-server-protocol/src/protocol/v2/thread.rs`：`ContextCompactedNotification` 已标注 deprecated，并提示使用 `ContextCompaction` item type。

## 待验证问题

- `should_use_remote_compact_task()` 与 remote compaction v1/v2 的选择策略需要单独追踪，当前页面只覆盖 local Responses compaction 主路径。
- 摘要质量、摘要提示版本、不同模型下的 compaction 保真度，没有从源码中得到可量化保证。
- `model_auto_compact_token_limit_scope` 的配置默认值、用户可见配置项和 app-server API 映射还需要继续读 config schema。
- `ContextCompactedNotification` deprecated 后，所有客户端是否都已经迁移到 `ContextCompaction` item type，仍需验证。

## Related

- [[long-horizon/precompact-postcompact-hooks]]
- [[long-horizon/turn-context-and-runtime-metadata]]
- [[memory/compaction-as-information-loss]]
- [[long-horizon/rollout-trace-and-resume]]
- [[owasp/t5-cascading-hallucination]]
