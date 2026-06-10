---
title: "Memory Read / Write / Consolidation"
type: "wiki"
created: "2026-06-01"
updated: "2026-06-01"
tags:
  - long-horizon
  - memory
  - consolidation
  - rollout
  - provenance
sources:
  - "derived-knowledge/index.md"
  - "derived-knowledge/raw/understand-graph-summary.json"
  - "derived-knowledge/raw/source-file-map.json"
  - "codex-rs/memories/README.md"
  - "codex-rs/memories/read/templates/memories/read_path.md"
  - "codex-rs/memories/read/src/citations.rs"
  - "codex-rs/memories/write/src/phase1.rs"
  - "codex-rs/memories/write/src/phase2.rs"
  - "codex-rs/ext/memories/src/extension.rs"
  - "codex-rs/protocol/src/memory_citation.rs"
  - "codex-rs/state/src/runtime/memories.rs"
---

## 定义

Codex memory 是跨运行复用经验的本地层。读路径把 memory folder 的使用策略注入为 developer policy，并解析 assistant 输出里的 memory citation；写路径把 rollout 先抽取成 per-thread raw memory，再通过全局 consolidation agent 写入文件系统 memory artifacts。

写入分两阶段：

1. Phase 1: Rollout Extraction。它选择近期、可用、足够 idle、未被其它 worker 占用的 rollout，要求模型输出 `raw_memory`、`rollout_summary`、`rollout_slug`，然后脱敏并写回 state DB。
2. Phase 2: Global Consolidation。它 claim 全局锁，把选中的 stage-1 outputs 同步到 memories root，生成 `phase2_workspace_diff.md`，再启动一个内部 consolidation agent 更新 `MEMORY.md`、`memory_summary.md`、`skills/` 等高层记忆产物。

可把 memory pipeline 看成两级压缩：

\[
Rollout_i \xrightarrow{Phase1} RawMemory_i,\quad
\{RawMemory_i\}_{i=1}^{k} \xrightarrow{Phase2} ConsolidatedMemory
\]

Phase 1 偏“单次经历提炼”，Phase 2 偏“多次经历合并”。

## 为什么重要

长程任务常遇到相似仓库、相同 Windows 细节、重复失败命令和旧决策。memory 的价值是避免每次重新撞墙；风险是旧结论可能过期，或来源被混淆。好的 memory 像带出处的工程笔记，坏的 memory 像没有日期的传言。

读路径模板要求在自包含任务中跳过 memory，在涉及 workspace/repo/module/path 或 prior context 时使用 memory，并要求引用 `MEMORY.md`、rollout summaries 和 rollout IDs。这说明 memory 的复用条件包含任务相关性、证据路径和来源边界。

Phase 2 consolidation agent 被锁得很紧：ephemeral、`generate_memories = false`、`use_memories = false`、无 MCP servers、approval policy `Never`、禁用 collab/apps/plugins/skill dependency install、workspace-write 仅写 memory root、network disabled。这个约束像把整理档案的人关在档案室里，只给本地笔和纸。

## 代码仓证据

- `codex-rs/memories/README.md`：声明 `codex-memories-read` 负责 read path、citation parsing、read-usage telemetry；`codex-memories-write` 负责 Phase 1/Phase 2 prompt rendering、filesystem artifact helpers、workspace diff helpers。
- `codex-rs/memories/README.md`：When it runs 条件包括 root session starts、session 非 ephemeral、memory feature enabled、session 非 sub-agent、state DB available。
- `codex-rs/memories/README.md`：Phase 1 选择 allowed interactive session sources、age window、idle window、lease/claim limits，并并行处理。
- `codex-rs/memories/write/src/phase1.rs`：`StageOneOutput` 严格包含 `raw_memory`、`rollout_summary`、`rollout_slug`；`output_schema()` 要求三字段并拒绝 additional properties。
- `codex-rs/memories/write/src/phase1.rs`：Phase 1 输出写入前调用 `redact_secrets()` 处理 `raw_memory`、`rollout_summary`、`rollout_slug`。
- `codex-rs/memories/write/src/phase2.rs`：`run()` 的步骤包括 claim global Phase 2 lock、prepare memory workspace、load DB-backed Phase 2 inputs、sync workspace inputs、compute git diff、write workspace diff、spawn consolidation agent。
- `codex-rs/memories/write/src/phase2.rs`：`agent::get_config()` 将 consolidation agent 设置为 `ephemeral = true`，关闭 memory 读写反馈、apps、plugins、collab、memory tool 和 network，只允许写 memory root。
- `codex-rs/memories/read/templates/memories/read_path.md`：定义 quick memory pass、memory layout、citation format 和更新 memory 的限制。
- `codex-rs/memories/read/src/citations.rs`：`parse_memory_citation()` 从 `<citation_entries>` 与 `<rollout_ids>` 提取 `MemoryCitation`，并去重 rollout IDs。
- `codex-rs/protocol/src/memory_citation.rs`：`MemoryCitation` 包含 `entries` 与 `rollout_ids`；`MemoryCitationEntry` 包含 `path`、`line_start`、`line_end`、`note`。
- `codex-rs/ext/memories/src/extension.rs`：`MemoriesExtension` 在 enabled 时注入 memory developer instructions；tool contributor 当前没有注册到 app-server。
- `codex-rs/state/src/runtime/memories.rs`：stage-1 startup job 查询排除 `threads.memory_mode != 'enabled'` 的线程。

## 待验证问题

- `codex-rs/memories/README.md` 说 runtime orchestration 仍在 `codex-core` 下，但证据包列出的实现已经落在 `codex-rs/memories/write` 与 state runtime 中；需要确认文档是否滞后。
- citation parser 解析 citation 结构，但当前片段没有看到文件存在性校验、行号校验或 note 内容校验。
- consolidation agent 的实际提示 `write/templates/memories/consolidation.md` 还需要单独拆解，才能写出它如何取舍冲突记忆。
- memory feature flag、`generate_memories`、`use_memories`、`MemoryTool` 三者的组合语义需要读完整 config 和 feature gating。

## Related

- [[memory/memory-threat-model]]
- [[memory/memory-citation-and-provenance]]
- [[long-horizon/rollout-trace-and-resume]]
- [[memory/session-isolation-and-memory-mode]]
- [[source/local-research-notes]]
