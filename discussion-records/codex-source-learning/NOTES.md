# Notes

## Local Preferences

- Use Chinese for explanations.
- Preserve key English source terms such as `AskForApproval`, `SandboxPermissions`, `ExecPolicy`, `Guardian`, `AgentIdentity`, `TurnContext`, and `replacement_history`.
- Start from the user's observed behavior, then trace to source files.
- Mark assumptions explicitly when source evidence is incomplete.
- Keep raw discussion records separate from stable wiki synthesis.

## Naming

- Session records: `sessions/YYYYMMDD-topic-slug.md`
- Learning records: `learning-records/0001-topic-slug.md`
- Reference pages: `reference/topic-slug.html`；既有历史 Markdown 原样保留。
- Lessons: `lessons/0001-topic-slug.html`

## Current Learning Focus — 2026-07-15

- 主题：GPT-5.6 Sol Ultra 在长程 Agent 任务中的复合系统机制。
- 起点：先建立“长上下文—长程执行—可恢复性”的分层心智模型，再进入 multi-agent、rollout、compaction、Goal、预算与训练证据。
- 当前水平尚未通过练习验证；第一课包含自动反馈测验，用于确定后续最近发展区。
- 下一次学习先做无提示检索：解释 Sol、`max`、Ultra 和 Goal/rollout 分别属于哪个层级。
- 研究报告绑定源码 `26f5998e`；当前 HEAD 为 `e623315e`，相差 82 个提交。涉及实现现状的课堂结论需重新核验。
- 官方 Codex 手册抓取器在 2026-07-15 返回 HTTP 403；Docs MCP 未暴露，本机 `codex mcp` 又因 `service_tier = default` 配置兼容问题无法加载。第一课官方事实通过 OpenAI 官方域名页面直接复核。
