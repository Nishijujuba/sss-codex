---
title: "Rollout Trace and Resume"
type: "wiki"
created: "2026-06-01"
updated: "2026-06-01"
tags:
  - long-horizon
  - rollout
  - resume
  - trace
  - thread-store
sources:
  - "derived-knowledge/index.md"
  - "derived-knowledge/raw/understand-graph-summary.json"
  - "derived-knowledge/raw/source-file-map.json"
  - "codex-rs/rollout/src/recorder.rs"
  - "codex-rs/core/src/session/rollout_reconstruction.rs"
  - "codex-rs/thread-store/README.md"
  - "codex-rs/thread-store/src/local/live_writer.rs"
  - "codex-rs/rollout-trace/README.md"
  - "codex-rs/rollout-trace/src/inference.rs"
  - "codex-rs/protocol/src/protocol.rs"
---

## 定义

`rollout` 是本地 JSONL 历史记录，用来保存 session/thread 的 canonical items 和 metadata。`resume` 是从既有 rollout 文件或 thread store 重新装载历史，构造新的 live thread，使后续 `turn/start` 可以继续追加。

`rollout-trace` 是另一层诊断机制。它在设置 `CODEX_ROLLOUT_TRACE_ROOT` 后写本地 trace bundle：`manifest.json`、`trace.jsonl`、`payloads/*.json`，再由 offline reducer 生成 `state.json`。它服务于调试和取证，README 明确说该路径不属于 telemetry，且本地 bundle 可能包含 prompts、responses、tool IO、terminal output 和 paths。

两者的关系可以类比账本和显微镜：rollout 是正式账本，记录可恢复历史；rollout-trace 是显微镜，记录更多 raw runtime evidence，方便复盘“为什么账本变成这样”。

## 为什么重要

长程任务一定会遇到中断、app 重启、上下文压缩、分叉和子线程。resume 需要从旧 JSONL 重建模型可见历史、previous turn settings、reference context item。如果重建错了，下一轮模型就会站在错误地面上继续工作。

`rollout_reconstruction.rs` 的反向扫描策略很关键：它从最新往最旧扫描，寻找 surviving replacement-history checkpoint、previous turn settings、reference context item，然后只回放必要 suffix。这像从事故现场倒着找最近的完整快照，找到后再向前复演尾部变化。

rollout-trace 进一步解决可解释性：模型看到的 conversation、runtime tool boundary、terminal operation、multi-agent edge 分别建模，并用 raw payload ref 回到原始证据。它对安全审计尤其重要，因为“工具确实执行过某段输出”与“模型看到了同样字节”是两种事实。

## 代码仓证据

- `codex-rs/rollout/src/recorder.rs`：`RolloutRecorderParams` 有 `Create` 与 `Resume { path }`；`RolloutRecorder::new()` 对新 session 预计算路径和 metadata，对 resumed session 直接 append 打开既有 rollout file。
- `codex-rs/rollout/src/recorder.rs`：`get_rollout_history()` 调用 `load_rollout_items()`，成功后返回 `InitialHistory::Resumed(ResumedHistory { conversation_id, history, rollout_path })`。
- `codex-rs/protocol/src/protocol.rs`：`InitialHistory` 枚举包括 `New`、`Cleared`、`Resumed`、`Forked`；`ResumedHistory` 保存 `conversation_id`、`history`、`rollout_path`。
- `codex-rs/thread-store/README.md`：`ThreadStore::append_items` 是 raw canonical history append API；`LocalThreadStore` 用 JSONL 保存历史，用 SQLite 保存可查询 metadata；`RolloutRecorder` 只写 canonical items。
- `codex-rs/thread-store/src/local/live_writer.rs`：`resume_thread()` 会解析 rollout path，构造 `RolloutConfig`，通过 `RolloutRecorderParams::resume(rollout_path)` 创建 recorder，再放入 live recorder map。
- `codex-rs/core/src/session/rollout_reconstruction.rs`：`RolloutReconstruction` 返回 `history`、`previous_turn_settings`、`reference_context_item`。
- `codex-rs/core/src/session/rollout_reconstruction.rs`：`turn_ids_are_compatible()` 允许 active turn id 缺失或与 item turn id 匹配；`TurnStarted` 被当作反向 segment 的最旧边界。
- `codex-rs/core/src/session/rollout_reconstruction.rs`：遇到 `Compacted` 且带 `replacement_history` 时，会把它作为完整 history base，并停止更老历史影响。
- `codex-rs/core/src/thread_manager.rs`：`ForkSnapshot::Interrupted` 会在 mid-turn snapshot 上追加与 live interrupt path 相同的 `TurnAbortedEvent` marker。
- `codex-rs/rollout-trace/README.md`：定义 bundle layout、raw evidence vs reduced graph、multi-agent v2 bundle 共享、reducer invariants。
- `codex-rs/rollout-trace/src/inference.rs`：测试显示 trace writer 记录 `RawTraceEventPayload::ThreadStarted`、`RawTraceEventPayload::CodexTurnStarted` 和 inference attempt。

## 待验证问题

- `codex-rs/rollout/README.md` 在 evidence map 中不存在；rollout recorder 的设计意图主要来自源码注释和 thread-store README。
- `rollout-trace` README 明确是 opt-in diagnostic path，不能把它等同于默认 resume 所需的 product storage。
- `reconstruct_history_from_rollout()` 注释提到未来 lazy reverse loader，这说明当前 eager bridge 可能是过渡实现；后续设计需要继续确认。
- app-server `thread/resume` 的 mapper、token usage restored notification 和 `excludeTurns` 分页行为需要结合 server 代码与测试补证。

## Related

- [[long-horizon/thread-session-turn-model]]
- [[long-horizon/context-compaction-flow]]
- [[security/auditability-and-forensics]]
- [[memory/memory-citation-and-provenance]]
- [[source/test-evidence-map]]
