---
title: "Thread / Session / Turn Model"
type: "wiki"
created: "2026-06-01"
updated: "2026-06-01"
tags:
  - long-horizon
  - thread
  - session
  - turn
  - app-server
  - rollout
sources:
  - "derived-knowledge/index.md"
  - "derived-knowledge/raw/understand-graph-summary.json"
  - "derived-knowledge/raw/source-file-map.json"
  - "codex-rs/protocol/src/thread_id.rs"
  - "codex-rs/protocol/src/session_id.rs"
  - "codex-rs/protocol/src/protocol.rs"
  - "codex-rs/core/src/codex_thread.rs"
  - "codex-rs/core/src/thread_manager.rs"
  - "codex-rs/app-server/README.md"
  - "codex-rs/app-server-protocol/src/protocol/v2/thread_data.rs"
---

## 定义

`Thread` 是 Codex 对一段可继续工作的对话历史的主身份。`Session` 是一次运行时装载后的执行上下文，包含模型、权限、cwd、插件、hook、状态库、rollout writer 等活动资源。`Turn` 是用户输入触发的一轮 agent 工作，通常从 `TurnStartedEvent` 开始，以 `TurnCompleteEvent` 或 `TurnAbortedEvent` 结束，中间挂载多个 `Item`，例如用户消息、推理、工具调用、命令输出、补丁和最终回复。

用集合语言描述，thread 可以看成有序 turn 序列：

\[
Thread = \langle Turn_1, Turn_2, \dots, Turn_n \rangle,\quad
Turn_i = \langle Item_{i,1}, Item_{i,2}, \dots, Item_{i,m} \rangle
\]

这个模型的关键点在身份分层：`ThreadId` 与 `SessionId` 都是 UUID v7 字符串类型；`SessionId` 可以和 `ThreadId` 互相转换，但 app-server 的 `Thread.session_id` 注释把它描述成“同一个 session tree 共享的 id”。因此，页面只能确认代码存在 thread/session 身份转换与 session-tree 字段，不能直接断言产品层所有 session-tree 语义都已经稳定。

## 为什么重要

长程任务需要“能重新找到同一件事”的锚点。`thread_id` 负责把长期历史和元数据归档到同一个对象；`session_id` 负责把一次运行时树里的主线程和子线程关联起来；`turn_id` 负责把一轮工作里的事件、hook、工具调用、stream delta 和最终状态串起来。

如果把这些边界混用，恢复会出现三类硬问题：一是 UI 无法判断某条 `item/completed` 属于哪一轮；二是 fork/resume 会把半截 turn 当成完整历史；三是 memory 和 rollout 只能看到散乱消息，难以判断“这是一轮失败、完成、打断，还是上下文压缩后的续写”。

`EventMsg` 里保留了兼容线索：`TurnStarted` 在 v1 wire format 中叫 `task_started`，`TurnComplete` 叫 `task_complete`。这说明长期追踪时需要同时理解旧命名和新命名，像看地层一样读历史文件；旧层叫 task，新层叫 turn，但都在描述一轮 agent 执行边界。

## 代码仓证据

- `codex-rs/protocol/src/thread_id.rs`：`ThreadId::new` 使用 `Uuid::now_v7()`，并实现 `Display`、`Serialize`、`Deserialize`、`JsonSchema`。
- `codex-rs/protocol/src/session_id.rs`：`SessionId` 同样是 UUID v7；`impl From<ThreadId> for SessionId` 和 `impl From<SessionId> for ThreadId` 证明两者可转换。
- `codex-rs/protocol/src/protocol.rs`：`EventMsg` 定义 `TurnStarted`、`TurnComplete`、`TurnAborted`、`SessionConfigured`、`ContextCompacted`；`TurnStarted` 通过 `#[serde(rename = "task_started", alias = "turn_started")]` 保留旧 wire name。
- `codex-rs/protocol/src/protocol.rs`：`SessionConfiguredEvent` 携带 `session_id`、`thread_id`、`forked_from_id`、`model`、`approval_policy`、`permission_profile`、`cwd`、`initial_messages`、`rollout_path`。
- `codex-rs/protocol/src/protocol.rs`：`InitialHistory` 有 `New`、`Cleared`、`Resumed(ResumedHistory)`、`Forked(Vec<RolloutItem>)`，把启动历史分成新建、清空、恢复、分叉四类。
- `codex-rs/core/src/codex_thread.rs`：`CodexThread` 包含 `Codex`、`session_source`、`SessionConfiguredEvent` 和 `rollout_path`，并提供 `submit`、`steer_input`、`flush_rollout`、`set_thread_memory_mode`。
- `codex-rs/core/src/thread_manager.rs`：`ThreadManager` 维护 `HashMap<ThreadId, Arc<CodexThread>>`，`NewThread` 把 `thread_id`、`CodexThread`、`SessionConfiguredEvent` 绑定。
- `codex-rs/app-server/README.md`：Core Primitives 明确说明 `Thread` 包含多个 `Turn`，`Turn` 包含多个 `Item`；Lifecycle Overview 描述 `thread/start`、`thread/resume`、`thread/fork`、`turn/start`、`turn/interrupt`。
- `codex-rs/app-server-protocol/src/protocol/v2/thread_data.rs`：`Thread` 有 `id`、`session_id`、`forked_from_id`、`turns`；`Turn` 有 `id`、`items`、`items_view`、`status`、`started_at`、`completed_at`、`duration_ms`。

## 待验证问题

- `SessionId` 与 `ThreadId` 可互转这件事，到底是历史兼容、实现便利，还是有明确产品设计文档支撑的 session-tree 规则，仍需人工确认。
- `task_started` / `task_complete` 到 `turn_started` / `turn_complete` 的命名迁移是否已经完成；现有代码仍保留 alias，说明外部 trace 或旧 rollout 可能继续使用旧名。
- app-server `Thread.session_id` 对子线程、fork、resume、stored thread 的完整语义需要结合 server mapper 和端到端测试继续验证。
- `Item` 的“持久化历史”与“UI summary view”之间是否存在数据裁剪策略，不能仅凭 `ThreadItem` schema 推断。

## Related

- [[long-horizon/turn-context-and-runtime-metadata]]
- [[long-horizon/rollout-trace-and-resume]]
- [[long-horizon/context-compaction-flow]]
- [[architecture/app-server-desktop-api]]
- [[source/security-relevant-file-map]]
