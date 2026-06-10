---
title: "Turn Context and Runtime Metadata"
type: "wiki"
created: "2026-06-01"
updated: "2026-06-01"
tags:
  - long-horizon
  - turn-context
  - runtime-metadata
  - sandbox
  - permissions
sources:
  - "derived-knowledge/index.md"
  - "derived-knowledge/raw/understand-graph-summary.json"
  - "derived-knowledge/raw/source-file-map.json"
  - "codex-rs/core/src/session/turn_context.rs"
  - "codex-rs/core/src/session/turn.rs"
  - "codex-rs/protocol/src/protocol.rs"
  - "codex-rs/app-server-protocol/src/protocol/v2/turn.rs"
---

## 定义

`TurnContext` 是一轮执行的运行时快照。它把 `sub_id`、`cwd`、当前日期、timezone、模型、provider、reasoning effort、approval policy、permission profile、sandbox policy、network policy、dynamic tools、skills、collaboration mode、personality、truncation policy 等信息放在同一个结构里。

`TurnContextItem` 是这个快照的持久化切片。它写入 rollout，用来让 resume/fork 恢复“当时那轮运行看到的世界”。源码注释说它会在真实用户 turn 的 model-visible context updates 之后持久化，并在 mid-turn compaction 之后再次持久化，这说明它承担的是可恢复基线，而非单纯日志。

可以把它类比成航海日志里的“出航条件页”：船的位置是 `cwd`，天气是日期和 timezone，航行规则是权限与 sandbox，船型是 model/provider，临时工具是 dynamic tools。少了这些元数据，后续只看到航迹，无法判断当时哪些动作可行、哪些输出可靠。

## 为什么重要

长程任务常跨越多次运行、compaction 和恢复。用户看到的是一条连续任务，系统看到的是多轮采样、多次工具调用和多份上下文。`TurnContext` 把“这一轮怎样执行”定格下来，避免恢复时把当前 cwd、当前权限或当前模型误套到旧历史上。

数学上可以把 model-visible prompt 写成：

\[
P_t = f(H_t, C_t, I_t)
\]

其中 \(H_t\) 是历史，\(I_t\) 是本轮输入，\(C_t\) 是 `TurnContext`。同一段历史和输入，在不同 `C_t` 下会产生不同工具可见性、路径解析、网络边界和推理预算。长期任务的可审计性依赖 \(C_t\) 这项被记录。

## 代码仓证据

- `codex-rs/core/src/session/turn_context.rs`：`TurnContext` 定义 `sub_id`、`trace_id`、`config`、`model_info`、`session_telemetry`、`provider`、`reasoning_effort`、`session_source`、`thread_source`、`cwd`、`current_date`、`timezone`、`developer_instructions`、`compact_prompt`、`user_instructions`、`approval_policy`、`permission_profile`、`network`、`windows_sandbox_level`、`truncation_policy`、`dynamic_tools`、`turn_skills`。
- `codex-rs/core/src/session/turn_context.rs`：`permission_profile()`、`file_system_sandbox_policy()`、`network_sandbox_policy()`、`sandbox_policy()` 从权限 profile 派生执行边界。
- `codex-rs/core/src/session/turn_context.rs`：`to_turn_context_item()` 输出 `turn_id`、`cwd`、`current_date`、`timezone`、`approval_policy`、`sandbox_policy`、`permission_profile`、`network`、`file_system_sandbox_policy`、`model`、`personality`、`collaboration_mode`、`realtime_active`、`effort`。
- `codex-rs/core/src/session/turn_context.rs`：`make_turn_context()` 从 `ThreadId`、`SessionId`、`SessionConfiguration`、per-turn `Config`、`ModelInfo`、environment selection 和 `sub_id` 构造 `TurnContext`。
- `codex-rs/protocol/src/protocol.rs`：`TurnContextItem` 注释明确指出它为 resume/fork replay 恢复 latest durable baseline。
- `codex-rs/core/src/session/turn.rs`：`run_turn()` 先运行 pre-sampling compaction，再记录 context updates 和 reference context item，然后 build skills/plugins，检查 pending input hook，最后进入采样循环。
- `codex-rs/core/src/session/turn.rs`：`track_turn_resolved_config_analytics()` 记录 `turn_id`、`thread_id`、ephemeral、session source、model、permission profile、approval policy、sandbox network access、collaboration mode、personality、is_first_turn。
- `codex-rs/app-server-protocol/src/protocol/v2/turn.rs`：`TurnStartParams` 支持 per-turn 覆盖 `cwd`、runtime workspace roots、approval policy、approvals reviewer、sandbox policy、permissions、model、service tier、effort、summary、personality、output schema、collaboration mode。

## 待验证问题

- 哪些 `TurnContext` 字段属于长期稳定 API，哪些只是当前实现细节，需要协议维护者确认。
- `TurnContextItem.summary` 注释称其是 compatibility-only 字段，未来 schema cleanup 的时间和兼容策略仍未知。
- app-server 的 per-turn override 会“影响本轮和后续 turns”，但不同字段在 core session 中的落点需要继续追到 mapper 和 settings update 流程。
- `turn_metadata_state.current_header_value()` 生成的 header 与上游 Responses API 的完整语义需要读 tracing/inference 代码后再写。

## Related

- [[long-horizon/thread-session-turn-model]]
- [[long-horizon/context-compaction-flow]]
- [[security/sandbox-policy-model]]
- [[security/approval-policy-and-guardian]]
- [[tools/tool-call-lifecycle]]
