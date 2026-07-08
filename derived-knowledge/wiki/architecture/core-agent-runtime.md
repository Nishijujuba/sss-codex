---
title: Core Agent Runtime
type: architecture
created: 2026-06-01
updated: 2026-06-01
tags:
  - architecture
  - core-runtime
  - turn
  - session
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/understand-graph-summary.json
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/core/src/lib.rs
  - codex-rs/core/src/session/mod.rs
  - codex-rs/core/src/session/session.rs
  - codex-rs/core/src/session/turn.rs
  - codex-rs/core/src/session/turn_context.rs
  - codex-rs/protocol/src/protocol.rs
  - codex-rs/protocol/src/models.rs
---

## 定义

Core Agent Runtime 指 `codex-core` 中把用户输入、thread/session 状态、turn 执行、model stream、tool calls、approval、sandbox、rollout 记录串起来的运行层。它是 agent 的“中枢神经”：外部入口可以来自 TUI、CLI exec、app-server 或 SDK，但核心执行必须落到 session/turn/context/tool/event 的组合上。

一个简化链路可以写成：

\[
UserInput \rightarrow Op/Submission \rightarrow Codex::submit \rightarrow Session \rightarrow run\_turn \rightarrow Model/Tools \rightarrow Event
\]

这里的 `TurnContext` 类似每次出车的“行车单”：它记录 cwd、model/config、approval policy、permission profile、filesystem/network sandbox policy、instructions、environment 等。没有这张行车单，工具执行和模型事件就缺少边界。

## 为什么重要

理解 runtime 能避免把表面入口和实际执行混在一起。TUI 的 chat widget、app-server 的 `turn/start`、SDK 的 exec wrapper 都可能影响输入形态，但核心行为仍要看 `codex-core` 如何构造 session、处理 turn、发起 tool call、回传 `Event`。

同时，runtime 是 long-horizon agent 的根部：thread resume、rollout、compaction、memory mode、subagent spawn、approval review 都在这里出现。安全页若直接谈 sandbox 或 guardian，也需要回到 runtime，看它们在 turn 生命周期中何时被调用。

## 代码仓证据

- `codex-rs/core/src/lib.rs`: module/export map 暴露 `CodexThread`、`CodexThreadSettingsOverrides`、`ThreadConfigSnapshot`、`TurnContext`、`McpManager`、`RolloutRecorder`、`ThreadManager`、`ModelClient`、`ResponseEvent`、`ResponseStream` 等 runtime-facing types。
- `codex-rs/core/src/session/mod.rs`: 定义 `Codex`、`CodexSpawnOk`，并实现 `Codex::spawn`、`spawn_internal`、`submit`、`submit_with_trace`、`submit_with_id`、`shutdown_and_wait`、`next_event`、`steer_input`。
- `codex-rs/core/src/session/mod.rs`: `Session` impl 内有 `request_command_approval`、`request_patch_approval`、`request_permissions`、`request_user_input`、`notify_approval`、`notify_dynamic_tool_response`、`interrupt_task` 等 runtime interaction points。
- `codex-rs/core/src/session/session.rs`: 定义 `Session`、`SessionConfiguration`、`SessionSettingsUpdate`，并在初始化路径中创建或预置 `McpConnectionManager`。
- `codex-rs/core/src/session/turn.rs`: `run_turn` 是 turn 执行主入口；同文件的 `build_skills_and_plugins` 说明技能和插件在 turn 前被装配；`auto_compact_token_status`、`run_pre_sampling_compact`、`run_auto_compact` 说明 compaction 与 turn 绑定。
- `codex-rs/core/src/session/turn_context.rs`: `TurnContext` 提供 `permission_profile`、`file_system_sandbox_policy`、`network_sandbox_policy`、`sandbox_policy`、`effective_reasoning_effort` 等访问器。
- `codex-rs/protocol/src/protocol.rs`: `AskForApproval`、`SandboxPolicy`、`ResponseItem`、`ReviewDecision` 等 protocol types 描述 runtime 对外可见的控制和事件。
- `codex-rs/protocol/src/models.rs`: `SandboxPermissions`、`PermissionProfile`、`AdditionalPermissionProfile` 描述 per-command、turn、session 级权限模型。

## 待验证问题

- `run_turn` 内部包含大量分支；当前页只确认主入口和相邻符号，具体 model provider、tool router、stream event ordering 需要下钻到对应函数和 tests。
- `Session` 与 `CodexThread` 的职责边界需要专页复核，尤其是 thread store、resume/fork、multi-agent child event forwarding。
- `build_skills_and_plugins` 证明 skills/plugins 在 turn 装配中出现，但加载优先级、启用/禁用规则、trust 状态需要结合 `core-skills`、`core-plugins`、app-server plugin APIs 继续验证。
- runtime 里 compaction、memory citation、rollout trace 的安全含义不能只从函数名推断，应由 long-horizon 与 memory 页面补证。

## Related

- [[long-horizon/thread-session-turn-model]]
- [[long-horizon/turn-context-and-runtime-metadata]]
- [[long-horizon/context-compaction-flow]]
- [[architecture/mcp-tools-skills-connectors]]
- [[architecture/sandbox-exec-security-host-integration]]
- [[security/security-control-map]]
