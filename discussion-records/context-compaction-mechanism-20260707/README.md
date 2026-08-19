# Codex 上下文压缩机制讨论记录

记录日期：2026-07-07

## 结论

Codex 的上下文压缩机制以 `replacement_history` 为核心：压缩任务把旧的模型可见历史转换成一组新的 `ResponseItem`，再用这组新历史替换当前 session 的活跃 history。旧 rollout 仍然保留 `CompactedItem` 检查点，用于恢复、fork 和审计；后续模型推理读取的是替换后的活跃历史，加上每轮重新注入或差量注入的上下文。

压缩机制包含三层：

1. 压缩请求输入：把当前历史、基础指令、工具规格和压缩提示送入本地模型或远端 `/responses/compact`。
2. 压缩结果安装：生成或接收新的 `replacement_history`，写入 `RolloutItem::Compacted`，推进 auto-compact window generation。
3. 后续上下文重建：通过 `build_initial_context` 或 settings diff 注入权限、开发者指令、环境、skills、apps、plugins 等运行上下文。

## 本次侧线程上下文变化

本次侧线程看到的是压缩后的继承摘要、侧线程边界规则、用户在边界后重新提供的 `AGENTS.md`、以及本轮关于压缩机制的讨论。父线程中 YouTube 转 PDF 的长对话、完整工具输出、子代理完整消息和中间执行细节没有逐 token 保留；摘要保留了视频标题、输出目录、下载产物、子代理产物、已修改文件、最后失败点和父线程剩余计划等关键状态。

侧线程边界改变了指令活性：边界前的请求和计划只作为参考材料，边界后的用户消息才是当前侧线程的活跃指令。因此，父线程的 `/youtube-render-pdf` 工作不会在此记录创建过程中继续执行。

## 压缩摘要请求

本地压缩使用 `SUMMARIZATION_PROMPT`，默认提示词要求生成 handoff summary，并包含：

- 当前进度和关键决策
- 重要上下文、约束和用户偏好
- 剩余步骤
- 继续任务所需的关键数据、示例或引用

源码位置：

- `codex-rs/core/templates/compact/prompt.md`
- `codex-rs/core/src/compact.rs`

相关源码事实：

- `SUMMARIZATION_PROMPT` 从 `templates/compact/prompt.md` 读取。
- `SUMMARY_PREFIX` 从 `templates/compact/summary_prefix.md` 读取。
- `TurnContext::compact_prompt()` 优先使用配置中的 `compact_prompt`，没有配置时使用默认 `SUMMARIZATION_PROMPT`。

关键路径：

```text
TurnContext::compact_prompt()
  -> compact::SUMMARIZATION_PROMPT
  -> run_inline_auto_compact_task()
  -> run_compact_task_inner_impl()
```

## 本地压缩后保留什么

本地压缩完成后，`run_compact_task_inner_impl` 会读取当前 history，从最后一条 assistant message 中取出摘要正文，再拼上 `SUMMARY_PREFIX`。

随后它调用 `collect_user_messages()` 和 `build_compacted_history()` 构造新的 history。保留规则如下：

- 保留真实用户消息。
- 跳过已经是 compaction summary 的用户消息。
- 从最新用户消息往前保留，预算为 `COMPACT_USER_MESSAGE_MAX_TOKENS = 20_000`。
- 如果某条用户消息超过剩余预算，按 token 截断后保留。
- 最后追加一条 user-role 的 summary message。

被压缩进 summary 或失去细节的内容包括：

- 旧 assistant 回复
- 工具调用与工具输出
- reasoning item
- shell、function、MCP、web search、image generation 等调用项
- 早期用户消息中超出 20k token 预算的部分
- 子代理完整输出中的低权重细节

源码位置：

- `codex-rs/core/src/compact.rs:259`：从最后 assistant message 构造 `summary_text`。
- `codex-rs/core/src/compact.rs:388`：`collect_user_messages()` 只收集真实用户消息并跳过旧摘要。
- `codex-rs/core/src/compact.rs:465`：`build_compacted_history()` 构造新的 user messages + summary。
- `codex-rs/core/src/compact.rs:478`：从最新用户消息向前按 token 预算保留。

## 远端压缩后保留什么

远端压缩通过 `/responses/compact` 返回新的 `ResponseItem` 列表。请求 payload 包含：

- `model`
- `input`
- `instructions`
- `tools`
- `parallel_tool_calls`
- `reasoning`
- `service_tier`
- `prompt_cache_key`
- `text`

源码位置：

- `codex-rs/core/src/client.rs:430`
- `codex-rs/core/src/client.rs:480`
- `codex-rs/core/src/compact_remote.rs:179`

远端结果安装前会经过 `process_compacted_history()` 和 `should_keep_compacted_history_item()` 过滤。保留规则如下：

- 保留真实 `user` 消息。
- 保留 hook prompt。
- 保留 `assistant` 消息。
- 保留 `Compaction` 和 `ContextCompaction`。

过滤规则如下：

- 丢弃 `developer` 消息，避免远端输出包含陈旧或重复指令。
- 丢弃普通非 user/assistant message。
- 丢弃 `CompactionTrigger`。
- 丢弃 reasoning、local shell、function call、tool search、custom tool、web search、image generation 等调用项。

源码位置：

- `codex-rs/core/src/compact_remote.rs:251`
- `codex-rs/core/src/compact_remote.rs:273`
- `codex-rs/core/src/compact_remote.rs:289`

远端 v2 路径额外保留最近的 user/developer/system 文本，预算为 `RETAINED_MESSAGE_TOKEN_BUDGET = 64_000`，再追加唯一的 compaction output。随后仍会进入过滤和初始上下文插入流程。

源码位置：

- `codex-rs/core/src/compact_remote_v2.rs:46`
- `codex-rs/core/src/compact_remote_v2.rs:351`
- `codex-rs/core/src/compact_remote_v2.rs:367`

## replacement_history 怎样安装

压缩完成后，`replace_compacted_history()` 执行语义安装：

1. `state.replace_history(items, reference_context_item)` 替换活跃 history。
2. `state.start_next_auto_compact_window()` 开启新的自动压缩窗口。
3. 持久化 `RolloutItem::Compacted(compacted_item)`。
4. 如果 mid-turn 压缩重新建立了上下文基线，再持久化 `RolloutItem::TurnContext`。
5. `model_client.advance_window_generation()` 推进模型客户端窗口 generation。

源码位置：

- `codex-rs/core/src/session/mod.rs:2609`
- `codex-rs/core/src/state/session.rs:95`
- `codex-rs/protocol/src/protocol.rs:2688`

恢复时，`rollout_reconstruction` 会从最新的 `Compacted.replacement_history` 作为基线，再叠加它之后的 rollout suffix。

源码位置：

- `codex-rs/core/src/session/rollout_reconstruction.rs:110`
- `codex-rs/core/src/session/rollout_reconstruction.rs:123`

## 压缩后重新注入哪些上下文

重新注入由 `build_initial_context()` 和 `record_context_updates_and_set_reference_context_item()` 负责。

两种场景：

- pre-turn 或 manual compaction 使用 `InitialContextInjection::DoNotInject`。压缩后清空 `reference_context_item`，下一次普通 turn 会完整注入 initial context。
- mid-turn compaction 使用 `InitialContextInjection::BeforeLastUserMessage`。它会立即调用 `build_initial_context()`，并把 initial context 插到最后真实用户消息或摘要前面，使 compaction summary 或 compaction item 保持在末尾。

源码位置：

- `codex-rs/core/src/compact.rs:50`
- `codex-rs/core/src/compact.rs:418`
- `codex-rs/core/src/compact_remote.rs:251`
- `codex-rs/core/src/session/mod.rs:2929`

`build_initial_context()` 会生成以下模型可见上下文：

- model switch instructions
- permissions / sandbox / approval / exec policy instructions
- developer instructions
- collaboration mode instructions
- realtime state updates
- personality instructions
- apps / connectors instructions
- available skills instructions
- available plugins instructions
- extension prompt fragments
- user instructions
- environment context，包括 cwd、shell、日期、时区、权限配置、subagents 状态等
- multi-agent usage hint
- guardian reviewer 的独立 developer message

源码位置：

- `codex-rs/core/src/session/mod.rs:2670`
- `codex-rs/core/src/session/mod.rs:2701`
- `codex-rs/core/src/session/mod.rs:2724`
- `codex-rs/core/src/session/mod.rs:2761`
- `codex-rs/core/src/session/mod.rs:2775`
- `codex-rs/core/src/session/mod.rs:2798`
- `codex-rs/core/src/session/mod.rs:2808`
- `codex-rs/core/src/session/mod.rs:2830`
- `codex-rs/core/src/session/mod.rs:2840`
- `codex-rs/core/src/session/mod.rs:2857`

## 系统提示词与 history 的关系

这里需要区分两类模型可见内容：

1. `base_instructions` / API `instructions`
   它由 `sess.get_base_instructions()` 取出，并在每次 sampling request 中作为 `Prompt.base_instructions` 传给 API。远端压缩请求也会把它放进 `instructions` 字段。它不依赖 `replacement_history` 保存。

2. 作为 `ResponseItem` 注入的上下文
   例如 developer message、contextual user message、environment context、skills/apps/plugins 等。这些由 `build_initial_context()` 或 `build_settings_update_items()` 进入 history。

源码位置：

- `codex-rs/core/src/session/turn.rs:886`
- `codex-rs/core/src/session/turn.rs:927`
- `codex-rs/core/src/client.rs:460`
- `codex-rs/core/src/client.rs:480`
- `codex-rs/core/src/context_manager/updates.rs:183`
- `codex-rs/core/src/context_manager/updates.rs:209`

## 可操作理解模型

一次压缩后的下一次模型输入可以按这个结构理解：

```text
API instructions / base_instructions
+ tool specs
+ replacement_history
+ reinjected initial context 或 settings diff
+ 当前用户输入
```

其中 `replacement_history` 保存压缩后的对话状态；`base_instructions` 和 tool specs 每轮请求重新传；权限、环境、skills、apps、plugins 等上下文由 initial context 或 diff 机制补回。

## 风险与限制

- 摘要是有损压缩。被摘要覆盖的工具输出、子代理完整答复、早期对话措辞和低权重细节可能无法从当前上下文直接恢复。
- rollout 仍能保留检查点和 suffix，但恢复质量取决于 `replacement_history` 是否完整持久化。
- 远端压缩和本地压缩的保留策略不同；排查压缩问题时必须先确认走的是 Responses 本地路径、`/responses/compact` 路径，还是 remote v2 路径。
- `build_settings_update_items()` 源码里仍有 TODO，说明 steady-state diff 尚未覆盖 `build_initial_context()` 的全部模型可见项。

## 本次讨论中的术语

- `replacement_history`：压缩后安装为活跃历史的 `ResponseItem` 列表。
- `CompactedItem`：rollout 中记录压缩检查点的持久项，包含 `message` 和可选 `replacement_history`。
- `initial context`：每个真实 turn 需要的运行上下文，包括权限、环境、开发者指令、skills、apps、plugins 等。
- `reference_context_item`：用于判断下一轮需要完整注入 initial context，还是只注入 settings diff 的基线。
- `base_instructions`：API 请求级 instructions，独立于 history 注入机制。
- `contextual user message`：以 user role 注入的运行环境或用户配置上下文。
