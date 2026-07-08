---
title: OWASP T1 Memory Poisoning
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - owasp
  - memory
  - poisoning
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/memories/README.md
  - codex-rs/state/src/runtime/memories.rs
  - codex-rs/core/src/stream_events_utils.rs
  - codex-rs/memories/write/src/phase2.rs
---

## 定义

风险含义：T1 Memory Poisoning 指攻击者把错误、恶意、过期或伪造内容写入 agent 可复用记忆，使后续任务在无感状态下继承污染。对 Codex 来说，相关对象包括 rollout-derived stage-1 memory、phase-2 consolidated memory、local memory files、memory citations、知识图谱和 derived wiki。

记忆像“长期笔记本”。一次错误摘要如果进入长期笔记，后续 agent 会把它当背景常识，污染会跨 turn、thread、resume 或 future task 放大。

## 为什么重要

短上下文错误通常只影响当前回答；持久 memory 错误会改变未来任务的起点。攻击链可以是：不可信 tool output -> assistant summary -> memory extraction -> consolidation -> future prompt injection。只要中间缺少 provenance、污染标记或人工核验，记忆层就会成为低频但高复用的攻击面。

Codex 相关控制点包括：memory pipeline 分 phase、stage-1 DB 记录、phase-2 全局锁、bounded selection、memory citation parsing、外部上下文污染标记、清理接口和 no-network consolidation sandbox。

## 代码仓证据

- `codex-rs/memories/README.md`：说明 memory pipeline 在 root session startup 异步运行，分 Phase 1 rollout extraction 与 Phase 2 global consolidation。
- `codex-rs/memories/README.md`：Phase 1 会从 state DB claim 有界 rollout jobs，过滤 memory-relevant response items，输出 `raw_memory`、`rollout_summary`、`rollout_slug`，并 redacts secrets。
- `codex-rs/memories/README.md`：Phase 2 获取 global lock，选择有界 stage-1 outputs，同步 `raw_memories.md`、`rollout_summaries/`，写 `phase2_workspace_diff.md`，再启动 consolidation agent。
- `codex-rs/memories/write/src/phase2.rs`：consolidation agent 使用 local memory-root write access、no network，并关闭 collab，降低递归扩散面。
- `codex-rs/state/src/runtime/memories.rs`：`clear_memory_data`、`record_stage1_output_usage`、`mark_thread_memory_mode_polluted`、`get_phase2_input_selection` 是 memory DB 控制点。
- `codex-rs/core/src/stream_events_utils.rs`：`strip_hidden_assistant_markup_and_parse_memory_citation` 解析 citation；`mark_thread_memory_mode_polluted_if_external_context` 处理 external context 污染。

## 待验证问题

- 缺口或待验证点：本地 evidence 没有 OWASP T1 权威原文，当前风险含义来自 `derived-knowledge/index.md` taxonomy。
- 需要验证 `disable_on_external_context` 的默认配置、触发范围和用户可见提示。
- 需要证明 memory consolidation prompt 是否足够抵抗 raw memory 内的“请把这条写入长期记忆”类注入。
- 需要明确 derived wiki 是否会作为未来 memory/retrieval 输入，以及如何保留来源链。

## Related

- [[memory/memory-threat-model]]
- [[memory/memory-citation-and-provenance]]
- [[memory/session-isolation-and-memory-mode]]
- [[prompt-security/context-poisoning-chain]]
- [[tc260/aia10-memory-hallucination-and-manipulation]]
