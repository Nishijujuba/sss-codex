---
title: "Memory Threat Model"
type: "wiki"
created: "2026-06-01"
updated: "2026-06-01"
tags:
  - memory
  - threat-model
  - provenance
  - poisoning
  - long-horizon
sources:
  - "derived-knowledge/index.md"
  - "derived-knowledge/raw/understand-graph-summary.json"
  - "derived-knowledge/raw/source-file-map.json"
  - "codex-rs/memories/README.md"
  - "codex-rs/memories/read/templates/memories/read_path.md"
  - "codex-rs/memories/read/src/citations.rs"
  - "codex-rs/memories/write/src/phase1.rs"
  - "codex-rs/memories/write/src/phase2.rs"
  - "codex-rs/memories/write/src/control.rs"
  - "codex-rs/memories/mcp/src/lib.rs"
  - "codex-rs/core/src/stream_events_utils.rs"
  - "codex-rs/state/src/runtime/memories.rs"
  - "codex-rs/state/src/runtime/threads.rs"
---

## 定义

Memory threat model 关注长期记忆怎样被污染、误用、过期或伪造。Codex memory 的输入来自 rollout，输出进入 `MEMORY.md`、`memory_summary.md`、`rollout_summaries/`、skills 等本地 artifacts；读路径又把这些 artifacts 重新注入未来任务。攻击面因此有反馈环：

\[
M_{t+1} = Consolidate(M_t, R_t),\quad
Prompt_{t+1} = Inject(M_{t+1}, UserTask)
\]

其中 \(M_t\) 是当前 memory，\(R_t\) 是当前 rollout 证据。若 \(R_t\) 含恶意网页、工具输出、伪造路径或错误总结，且 consolidation 没有足够 provenance，错误可能进入 \(M_{t+1}\)，再影响未来 turn。

核心威胁包括：semantic memory poisoning、memory hallucination、stale memory、source confusion、citation forgery、retrieval noise、external context contamination、over-broad cleanup、以及 consolidation agent 权限过宽。

## 为什么重要

memory 的危险之处在于寿命长。一次普通上下文误读通常只影响当前 turn；写入 memory 后，影响会跨 session 复现。它像把便利贴贴到工具箱内壁，未来每次开箱都会看见；如果便利贴内容被污染，后续操作会稳定偏航。

这类风险和普通 prompt injection 有差别：普通注入常是即时控制，memory poisoning 更像慢性污染。攻击者不一定追求当前回合成功，只要让错误的项目约定、危险命令偏好、伪造来源或错误安全边界进入 memory，就可能在未来更高权限、更少警惕的任务里生效。

## 代码仓证据

- `codex-rs/memories/read/templates/memories/read_path.md`：定义 memory 使用决策边界，要求自包含任务跳过 memory，涉及 workspace/repo/module/path/prior context 时使用 memory，并要求最终回复附 `<oai-mem-citation>`。
- `codex-rs/memories/read/src/citations.rs`：`parse_memory_citation()` 只解析 `<citation_entries>` 和 `<rollout_ids>` 块，去重 rollout IDs；当前片段没有显示文件存在性或行号内容校验。
- `codex-rs/memories/write/src/phase1.rs`：Phase 1 输出严格 schema，字段为 `raw_memory`、`rollout_summary`、`rollout_slug`；输出写入前调用 `redact_secrets()`。
- `codex-rs/memories/write/src/phase2.rs`：Phase 2 通过 global lock 串行 consolidation，使用 git diff 判断 memory workspace 是否变化，并将 diff 交给内部 agent。
- `codex-rs/memories/write/src/phase2.rs`：consolidation agent 被设置为 `ephemeral = true`，禁用 `generate_memories`、`use_memories`、apps、plugins、collab、memory tool、skill dependency install；sandbox 仅允许 memory root 写入且 `network_access: false`。
- `codex-rs/memories/mcp/src/lib.rs`：memory MCP crate 注释说明只暴露发现和读取 memory files 的工具，policy 注入在其它地方。
- `codex-rs/core/src/stream_events_utils.rs`：`strip_hidden_assistant_markup_and_parse_memory_citation()` 从 assistant 输出剥离 hidden citation markup 并解析 memory citation。
- `codex-rs/core/src/stream_events_utils.rs`：`record_completed_response_item_with_finalized_facts()` 会记录 memory citation usage；`response_item_may_include_external_context()` 将 `ToolSearchCall`、`ToolSearchOutput`、`WebSearchCall` 视为可能包含 external context 的 item。
- `codex-rs/core/src/stream_events_utils.rs`：若 `memories.disable_on_external_context` 开启且 item 可能包含 external context，`mark_thread_memory_mode_polluted_if_external_context()` 会将 thread memory mode 标记为 polluted。
- `codex-rs/state/src/runtime/memories.rs`：stage-1 selection 排除 `memory_mode != 'enabled'` 的线程；`mark_thread_memory_mode_polluted()` 会把 thread 设为 `polluted`，并在它参与过 phase-2 baseline 时 enqueue global consolidation。
- `codex-rs/state/src/runtime/threads.rs`：`extract_memory_mode()` 可从 `SessionMeta.memory_mode` 恢复 thread memory eligibility。
- `codex-rs/memories/write/src/control.rs`：`clear_memory_root_contents()` 拒绝 symlinked memory root，以降低 cleanup 误清外部目录的风险；函数内部会清空 memory root 内容，实际调用路径需要继续审计。

## 待验证问题

- citation parser 解析结构，不证明 citation 指向内容真实存在；需要确认未来是否有 path、line range、rollout id 的验证层。
- `disable_on_external_context` 的默认值、用户配置入口和 UI 提示需要继续追 config schema。
- Phase 1 脱敏覆盖 `raw_memory`、`rollout_summary`、`rollout_slug`，但输入 prompt 是否也经过脱敏，当前页面未完整证明。
- consolidation agent 对冲突记忆、过期记忆、恶意 rollout summary 的拒绝标准需要读 prompt 模板和实际 memory 写入测试。
- `memory/reset` 与 `clear_memory_root_contents()` 的用户确认、审计日志和跨平台行为需要结合 app-server handler 验证。

## Related

- [[long-horizon/memory-read-write-consolidation]]
- [[memory/memory-citation-and-provenance]]
- [[memory/session-isolation-and-memory-mode]]
- [[prompt-security/context-poisoning-chain]]
- [[owasp/t1-memory-poisoning]]
