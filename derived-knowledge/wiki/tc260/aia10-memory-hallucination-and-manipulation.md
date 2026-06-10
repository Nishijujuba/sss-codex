---
title: TC260 AIA10 Memory Hallucination and Manipulation
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - tc260
  - memory
  - hallucination
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/memories/README.md
  - codex-rs/core/src/stream_events_utils.rs
  - codex-rs/state/src/runtime/memories.rs
  - codex-rs/memories/read/templates/memories/read_path.md
  - codex-rs/memories/write/templates/memories/consolidation.md
---

## 定义

风险含义：AIA10 指 RAG/semantic memory 漂移、伪造 memory fragment、session 隔离失败、记忆清理不足、snapshot evidence 缺失等问题。它覆盖“记错”和“被操控地记住”两类风险：前者来自压缩和摘要误差，后者来自攻击者主动把恶意内容送入可持久化路径。

Memory hallucination 像地图标错路；memory manipulation 像有人故意改地图。两者都会让未来 agent 在出发时偏航。

## 为什么重要

Codex memory pipeline 会把 rollout 经验转成可复用知识。这个机制提升长期效率，也把上下文压缩误差变成长期状态风险。没有 citation、pollution marker、bounded selection 和 cleanup，记忆层会把一次低质量工具输出放大成多次错误行动。

Codex 相关控制点包括：stage-1 extraction、phase-2 consolidation、memory citation parsing、stage-1 usage tracking、polluted mode、clear memory data、global consolidation lock、no-network consolidation agent。

## 代码仓证据

- `codex-rs/memories/README.md`：Phase 1 负责从 rollout 提取结构化 memory，Phase 2 负责全局 consolidation，并使用 git-style workspace diff。
- `codex-rs/core/src/stream_events_utils.rs`：`strip_hidden_assistant_markup_and_parse_memory_citation` 从 assistant 文本解析 memory citation；`record_stage1_output_usage_for_memory_citation` 记录 citation 引用到的 thread ids。
- `codex-rs/core/src/stream_events_utils.rs`：`mark_thread_memory_mode_polluted_if_external_context` 可在 external context 出现时将 thread memory mode 标为 polluted。
- `codex-rs/state/src/runtime/memories.rs`：`mark_thread_memory_mode_polluted` 将 `threads.memory_mode` 更新为 `polluted` 并处理 phase-2 forgetting enqueue；`clear_memory_data` 清理 stage-1 outputs 和 memory jobs。
- `codex-rs/memories/write/templates/memories/consolidation.md`：consolidation prompt 以 workspace diff 为输入，要求维护 memory artifacts 的结构。
- `codex-rs/memories/read/templates/memories/read_path.md`：定义 memory layout、quick memory pass 和 citation requirements，是 memory read path 的提示模板。

## 待验证问题

- 缺口或待验证点：本地 evidence 没有 TC260 AIA10 权威原文，当前风险含义来自 index taxonomy。
- 需要验证 polluted mode 对后续 read path 的实际影响，是禁用读取、降低权重，还是触发 forgetting。
- 需要测试 memory citation 是否能抵抗伪造 hidden markup。
- 需要定义 derived wiki 与 memory workspace 的互相引用边界，避免 wiki 生成结果被未来 memory 误当成原始证据。

## Related

- [[memory/memory-threat-model]]
- [[memory/memory-citation-and-provenance]]
- [[memory/compaction-as-information-loss]]
- [[owasp/t1-memory-poisoning]]
- [[prompt-security/context-poisoning-chain]]
