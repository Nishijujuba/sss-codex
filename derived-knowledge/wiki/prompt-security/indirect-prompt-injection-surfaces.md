---
title: 间接提示词注入面
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - prompt-security
  - instruction-integrity
  - untrusted-input
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/core/src/agents_md.rs
  - codex-rs/core/src/session/mod.rs
  - codex-rs/core-skills/src/loader.rs
  - codex-rs/core-skills/src/render.rs
  - codex-rs/codex-mcp/src/connection_manager.rs
  - codex-rs/core/src/guardian/policy_template.md
  - codex-rs/core/src/stream_events_utils.rs
---

## 定义

间接提示词注入是指攻击者通过“看似数据”的载体夹带指令，让 agent 把低信任内容误当成高权威指令。典型载体包括 repo 文件、`AGENTS.md`、skill 描述、plugin/app 说明、MCP tool description、web/email/calendar 内容、命令输出、code comments、generated artifact、memory citation 等。

它像把纸条塞进证据袋：证据可以帮助判断事实，但纸条上的“忽略你的规则”没有治理权。可信度需要按来源分层，而不能按文本出现位置自动升级。

## 为什么重要

Codex 的能力来自读写文件、运行命令、调用 MCP/connector、保存 memory。间接注入正好借这些能力把“读到的内容”转化成“下一步行动”。防线需要同时覆盖指令层级、工具输出边界、记忆污染、approval 触发和 traceability。

最小模型：\[
Impact = Reach(input) \times AuthorityConfusion \times ToolPower
\]
其中 `Reach` 是内容进入上下文的路径，`AuthorityConfusion` 是内容被误当作指令的概率，`ToolPower` 是后续工具副作用。

## 代码仓证据

- `codex-rs/core/src/agents_md.rs`：`AgentsMdManager` 从 project root 到 cwd 收集并拼接 `AGENTS.md`，还支持 `AGENTS.override.md` 和 fallback 文件；这些内容最终成为 model-visible user instructions。
- `codex-rs/core/src/session/mod.rs`：prompt 构建时加入 permissions instructions、developer instructions、apps instructions、skills instructions、plugin instructions、extension context fragments 和 user instructions。
- `codex-rs/core-skills/src/loader.rs`：skill roots 按 repo/user/system/admin scope 加载并排序，repo `.agents/skills` 也能进入 skill surface。
- `codex-rs/core-skills/src/render.rs`：skill 渲染文本包含“读取 `SKILL.md`、复用脚本、遵守触发规则”等 model-facing 指令。
- `codex-rs/codex-mcp/src/connection_manager.rs`：MCP manager 聚合 server tools/resources/templates，并保留 server origin、tool provenance、`server_pollutes_memory`。
- `codex-rs/core/src/guardian/policy_template.md`：guardian 明确把 transcript、tool call args、tool results、retry reason、planned action 当成 untrusted evidence。
- `codex-rs/core/src/stream_events_utils.rs`：`mark_thread_memory_mode_polluted_if_external_context` 在配置开启时将可能含外部上下文的 response item 标记为 polluted。

## 待验证问题

- 需要逐项确认 web、email、calendar、browser、GitHub issue、MCP resource 输出在最终 prompt 中的标签和来源隔离方式。
- `AGENTS.md` 是 repo instruction surface，仍需定义“项目指令可信但可被仓库贡献者修改”的治理边界。
- 需要标准化 tool output 的引用格式，让 evidence 和 instruction 的视觉边界更清楚。

## Related

- [[prompt-security/instruction-hierarchy]]
- [[prompt-security/tool-output-as-untrusted-data]]
- [[prompt-security/context-poisoning-chain]]
- [[memory/memory-threat-model]]
- [[tc260/aia01-agent-hijack]]
