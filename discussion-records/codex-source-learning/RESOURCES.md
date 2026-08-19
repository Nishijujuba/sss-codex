# Codex 长程 Agent 学习资源

## Knowledge

- [GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)
  Sol、`max`、Ultra、四 Agent 默认配置、公开评测与产品边界的首要官方来源。用于核对产品层主张。
- [GPT-5.6 Sol 模型页](https://developers.openai.com/api/docs/models/gpt-5.6-sol)
  模型 ID、上下文窗口、最大输出、工具支持和价格的官方 API 事实。用于区分模型层与产品 Harness 层。
- [Responses Multi-agent](https://developers.openai.com/api/docs/guides/responses-multi-agent)
  root/subagent 树、独立上下文、有界并发、综合职责与 WebSocket 协调的官方说明。用于学习并行任务分解。
- [Compaction](https://developers.openai.com/api/docs/guides/compaction)
  服务端与 standalone compaction 的官方语义。用于理解上下文缩减、连续性和不透明 compact item 的边界。
- [Using Goals in Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex)
  线程级持久目标、生命周期、预算与证据化完成的官方教程。用于理解长程任务的完成契约。
- [Harness Engineering](https://openai.com/index/harness-engineering/)
  仓库知识、execution plan、progress log、lint 和 CI 如何组成长任务控制平面的工程文章。
- [GPT-5.6 Sol Ultra 长程研究 final-v4](../gpt-5-6-sol-ultra-long-horizon-agent-research-20260711/final-v4-gpt-5-6-sol-ultra-long-horizon-agent-research-20260712.md)
  已独立验收的本地综合报告。官方网页快照截至 2026-07-12，源码基线为 `26f5998e`；当前 HEAD 结论需要重新核验。
- `codex-rs/core/src/session/`、`codex-rs/core/src/compact*.rs`、`codex-rs/core/src/agent/`、`codex-rs/core/src/tools/handlers/`
  turn、compaction、Agent graph、协作工具与 plan handler 的当前源码入口。用于后续逐机制源码课。
- `codex-rs/state/` 与 `codex-rs/protocol/`
  线程状态、Goal 持久化、spawn edge、rollout item 与公共协议的源码入口。用于核对 durability 和恢复语义。

## Wisdom (Communities)

- [openai/codex Issues](https://github.com/openai/codex/issues)
  真实故障、复现条件和维护者答复的公开场所。用于检验一项架构理解能否解释实际行为。
- [OpenAI Developer Community](https://community.openai.com/)
  API 集成经验与生产约束的社区。用于讨论 Responses、compaction 和 Multi-agent 的实际 Harness 取舍。

## Gaps

- Sol 的完整架构、训练数据构成、RL 轨迹比例与奖励权重没有公开资料。
- Ultra 私有调度器的任务分解、预算分配、重试、冲突仲裁和 synthesis 规则没有公开资料。
- 产品 Ultra、Responses Multi-agent beta 与本地 Codex V2 是否共享内部实现没有公开证明。
- 2026-07-12 报告基线 `26f5998e` 与当前 HEAD `e623315e` 相差 82 个提交；后续源码课需逐项做 delta 复核。

## Source-backed rule

源码和测试描述特定 commit 的实现，官方页面描述访问时的公开产品契约。研究报告、课程和 rollout 摘要属于二级综合材料，使用前需要核对版本与证据标签。
