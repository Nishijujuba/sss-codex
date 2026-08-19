# GPT-5.6 Sol Ultra 长程 Agent 研究：v3 独立审查后 Claim Ledger

> 版本：v3  
> 落盘时间：2026-07-12（Asia/Shanghai）  
> 源码基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`  
> 状态：历史草稿；后续版本不得覆盖本文件  
> 用途：把 v1、v2 与三轮独立审查收敛为最终报告可直接采用的主张账本

## 一、审查结论

三轮独立审查均未发现 P0 级问题：

- [v1 官方事实与推断审查](sources/review-v1-official-and-inference.md)：P0 0、P1 7、P2 9。
- [v1 源码事实审查](sources/review-v1-code-facts.md)：P0 0、P1 4、P2 8。
- [v2 评测与因果审查](sources/review-v2-evals-and-causality.md)：P0 0、P1 6、P2 5。

历史稿的核心架构成立，最终版必须吸收以下校正：

1. Ultra 官方直接事实是“默认四 Agent”。产品执行面固定采用“一个根 + 三个子 Agent”属于强推断；公开 Multi-agent API 与当前 Codex V2 都呈现这一可观察形态。
2. 公开 Responses API 的 reasoning effort 最高为 `max`，没有 `ultra`。当前 Codex 内部 `Ultra` 映射为线上 `max`，并在满足 V2、source 与 custom-hint 条件时启用 proactive multi-agent instruction。
3. 当前 V2 默认四个 session slot，根线程占一个；V2 spawn 路径明确忽略通用 `agent_max_depth=1`，没有一层树深上限。
4. token/限额路径至少有五条：摘要式 compaction、feature-gated TokenBudget fresh window、Goal token budget、root-tree RolloutBudget、账户 usage limit。
5. Goal objective 持久存在 SQLite；automatic continuation 和 objective update 会注入 objective。普通用户 turn 没有无条件 objective 重注入保证。
6. Goal 的三次 blocker 与 completion audit 是 prompt/tool contract；handler 不验证证据或 blocker 次数。terminal error runtime 可直接把 active goal 标为 blocked。
7. 公开 PTC 与本地 Code Mode 在设计上同构，执行面与协议是否相同属于未知。
8. Ultra 公开点估计是产品 bundle 的配置级分差。并发、额外总计算、worker prompt、上下文隔离、root synthesis 与重试机会没有公开独立消融。
9. MRCR 与 GraphWalks 是不同评分函数的合成长输入测试；它们不测 Agent durability。GraphWalks 发布长度标签的字符/token 单位未知。
10. 官方图片尚未本地下载与 `view_image`；当前引用只使用 HTML 表格和图相邻正文。

## 二、证据等级

| 标签 | 定义 | 允许的措辞 |
|---|---|---|
| `F1@2026-07-12` | OpenAI 当前官方页面、文档、System Card 直接声明 | “官方说明”“页面列出” |
| `F2@26f5998e` | 当前 checkout 的源码、schema 或测试直接支持 | “当前源码实现”“测试覆盖” |
| `F3` | benchmark 维护方、原始论文、数据卡或可复现实验 | “原始评测定义”“维护方报告” |
| `I1` | 至少两项独立 F1/F2/F3 支持的强解释，缺少直接消融 | “最合理解释”“共同支持” |
| `I2` | 可实施、可证伪的工程假设 | “建议实验验证”“可能机制” |
| `U` | 当前公开资料或当前源码没有建立 | “尚未披露”“本轮未发现证明” |

## 三、Claim Ledger

### A. 产品、模型与运行模式

| ID | 主张 | 等级 | 直接证据 | 限制 |
|---|---|---|---|---|
| A01 | `gpt-5.6-sol` 是 GPT-5.6 旗舰模型；`gpt-5.6` alias 当前路由到 Sol | F1 | [Model guidance](https://developers.openai.com/api/docs/guides/latest-model) | alias 可随时间变化 |
| A02 | Sol API 规格为 1,050,000 context、922,000 max input、128,000 max output | F1 | [Sol model page](https://developers.openai.com/api/docs/models/gpt-5.6-sol) | 公开 API 规格不等同于 Codex 产品配置 |
| A03 | 当前 Codex 目录给 Sol 配置 372,000 context、Code Mode only、Multi-agent V2、Responses Lite | F2 | [`models.json`](../../codex-rs/models-manager/models.json) | 服务端与其他产品面可能不同 |
| A04 | Ultra 官方默认协调四个 Agent | F1 | [GPT-5.6 release](https://openai.com/index/gpt-5-6/) | 官方没有公开完整私有拓扑和调度器 |
| A05 | Responses Multi-agent 采用 root/subagent 树，默认最多三个并发 subagent | F1 | [Multi-agent guide](https://developers.openai.com/api/docs/guides/responses-multi-agent) | 托管 API 与本地 V2 是不同执行面 |
| A06 | 当前 Codex V2 默认四个 session slots，根占一个，同时最多三个活跃子 Agent | F2 | [`config/mod.rs`](../../codex-rs/core/src/config/mod.rs) | 可配置或由产品 feature 改变 |
| A07 | “当前 Ultra 的可观察形态为 root + 最多三个并发子 Agent” | I1 | A04+A05+A06 | 私有产品不保证永远固定这一拓扑 |
| A08 | 公开 API effort 为 none/low/medium/high/xhigh/max，Ultra 不是公开 effort | F1 | [Model guidance](https://developers.openai.com/api/docs/guides/latest-model) | Codex 内部可有 Ultra 枚举 |
| A09 | 当前 Codex 把内部 Ultra 映射为线上 max，并在条件满足时注入 proactive multi-agent mode | F2 | [`client.rs`](../../codex-rs/core/src/client.rs)、[`multi_agents.rs`](../../codex-rs/core/src/session/multi_agents.rs) | 只限当前 V2/source/custom-hint 路径 |
| A10 | V2 没有通用 `agent_max_depth=1` 上限；子 Agent 可继续 spawn | F2 | [`spec_plan.rs`](../../codex-rs/core/src/tools/spec_plan.rs)、[`multi_agents_tests.rs`](../../codex-rs/core/src/tools/handlers/multi_agents_tests.rs) | 并发槽仍限制同一时刻活跃数 |

### B. 上下文、传输与工具编排

| ID | 主张 | 等级 | 直接证据 | 限制 |
|---|---|---|---|---|
| B01 | GPT-5.6 支持 persisted reasoning；目标和优先级稳定时可使用 `all_turns` | F1 | [Reasoning guide](https://developers.openai.com/api/docs/guides/reasoning#preserve-reasoning-across-calls) | stale reasoning 会造成 anchoring |
| B02 | 当前 Sol Responses Lite 请求设置 `ReasoningContext::AllTurns` | F2 | [`client.rs`](../../codex-rs/core/src/client.rs) | 服务端内部实现不可见 |
| B03 | Responses Lite 时当前客户端关闭普通 `parallel_tool_calls` 字段 | F2 | [`client.rs`](../../codex-rs/core/src/client.rs) | 原因由源码结构推断，未有单行设计声明 |
| B04 | 当前 WebSocket 增量请求只在非 input 属性一致且 input 是精确前缀扩展时复用 `previous_response_id` | F2 | [`client.rs`](../../codex-rs/core/src/client.rs) | turn sticky state 与物理连接缓存生命周期不同 |
| B05 | 2026-01 官方文章称当时 Codex 未用 `previous_response_id`；2026-07 当前源码已经使用 | F1+F2 | [Unrolling article](https://openai.com/index/unrolling-the-codex-agent-loop/)+B04 | 这是版本演进，不构成文档错误 |
| B06 | GPT-5.6 支持显式启用的 Programmatic Tool Calling | F1 | [PTC guide](https://developers.openai.com/api/docs/guides/tools-programmatic-tool-calling) | 支持不表示每个请求自动启用 |
| B07 | 当前 Sol 的本地 Code Mode 在 fresh V8 isolate 中编排 nested tools，无 Node/fs/network/console，提供 session 内存 `store/load` | F2 | [`description.rs`](../../codex-rs/code-mode-protocol/src/description.rs)、[`session.rs`](../../codex-rs/code-mode-protocol/src/session.rs) | `store/load` 不进入 rollout/SQLite，不能跨进程恢复 |
| B08 | PTC 与本地 Code Mode 都把确定性编排移出逐次自然语言工具往返 | I1 | B06+B07 | 两者是否共享 runtime、协议或计费路径为 U |
| B09 | 瘦 system prompt 在官方内部 coding-agent 样本中提高约 10–15% 分数，降低 41–66% token 与 33–67% 成本 | F1 | [Model guidance](https://developers.openai.com/api/docs/guides/latest-model) | 方向性样本，不能普遍外推 |

### C. Rollout、压缩与恢复

| ID | 主张 | 等级 | 直接证据 | 限制 |
|---|---|---|---|---|
| C01 | rollout JSONL 追加保存 timestamp 与 typed RolloutItem；paginated 格式可带 ordinal，legacy 可省略 | F2 | [`recorder.rs`](../../codex-rs/rollout/src/recorder.rs) | flush 强度不能自动等同全路径 fsync |
| C02 | live writer 在 SQLite metadata 更新前等待 recorder flush | F2 | [`live_writer.rs`](../../codex-rs/thread-store/src/local/live_writer.rs) | 仍有故障窗口 |
| C03 | RolloutItem 覆盖 ResponseItem、InterAgentCommunication、Compacted、TurnContext、WorldState、EventMsg | F2 | [`protocol.rs`](../../codex-rs/protocol/src/protocol.rs) | 各事件受独立持久化 policy 控制 |
| C04 | 本地摘要式 compaction 生成 handoff，并持久化 replacement history、窗口链、full WorldState 与 TurnContext | F2 | [`compact.rs`](../../codex-rs/core/src/compact.rs)、[`session/mod.rs`](../../codex-rs/core/src/session/mod.rs) | 多次压缩有明确准确率警告 |
| C05 | resume 从最新存活 replacement checkpoint 开始，正向重放后缀；旧 JSONL 不被重写 | F2 | [`rollout_reconstruction.rs`](../../codex-rs/core/src/session/rollout_reconstruction.rs) | 摘要遗漏不会自动全文回灌 |
| C06 | WorldState 使用稳定 section ID 与 full/merge-patch 记录模型需要重新看见的规则和环境 | F2 | [`world_state`](../../codex-rs/core/src/context/world_state/mod.rs) | 不保存任意运行时内存 |
| C07 | Responses 服务端 compaction 与本地摘要式 replacement-history 是不同路径 | F1+F2 | [Compaction guide](https://developers.openai.com/api/docs/guides/compaction)+C04 | 服务端摘要算法不可见 |
| C08 | Context compaction、Memory、项目 Artifact 的责任不同：当前 run 连续性、未来 run 流程经验、人工可审查事实 | F1 | [Memory and compaction cookbook](https://developers.openai.com/cookbook/examples/agents_sdk/building_reliable_agents_memory_compaction) | 三者需要显式同步策略 |

### D. 五条 token、预算与限额路径

| ID | 主张 | 等级 | 权威状态 | 达限行为与限制 |
|---|---|---|---|---|
| D01 | 摘要式 auto compaction | F2 | rollout checkpoint | local/remote summary 后继续；有语义损失 |
| D02 | feature-gated TokenBudget | F2 | context-window state + replacement checkpoint | 跳过摘要，清除旧 message items，建立 fresh context，重放 initial context/WorldState/TurnContext；默认关闭 |
| D03 | `/goal token_budget` | F2 | goals SQLite | 单条 SQL 累加 usage 并置 `budget_limited`；停止新增实质工作，任务仍未完成 |
| D04 | root-tree RolloutBudget | F2 | root tree 共享内存计数器 | `SessionBudgetExceeded`；reminder/terminal transcript 持久，weighted counter 未见 hydrate |
| D05 | 账户/服务 usage limit | F2+F1 | 服务端限额 + Goal `usage_limited` | Goal 状态持久，实际恢复时间由服务端决定 |

TokenBudget 证据：[`compact_token_budget.rs`](../../codex-rs/core/src/compact_token_budget.rs)、[`new_context_window.rs`](../../codex-rs/core/src/tools/handlers/new_context_window.rs)。Goal 证据：[`thread_goals.sql`](../../codex-rs/state/goals_migrations/0001_thread_goals.sql)、[`goals.rs`](../../codex-rs/state/src/runtime/goals.rs)。RolloutBudget 证据：[`rollout_budget.rs`](../../codex-rs/core/src/rollout_budget.rs)。

### E. Goal 与计划

| ID | 主张 | 等级 | 直接证据 | 限制 |
|---|---|---|---|---|
| E01 | Goal 持久保存 objective、status、budget、usage 与 time | F2 | [`0001_thread_goals.sql`](../../codex-rs/state/goals_migrations/0001_thread_goals.sql) | 不含细粒度步骤和证据列表 |
| E02 | automatic idle continuation 会注入 objective；objective update 可向活跃回合 steering | F2 | [`runtime.rs`](../../codex-rs/ext/goal/src/runtime.rs)、[`steering.rs`](../../codex-rs/ext/goal/src/steering.rs) | 普通 turn 不保证无条件重注入 |
| E03 | Goal usage 在 tool finish、turn stop/abort/error 等边界结算，SQL 原子处理 delta 与 budget transition | F2 | [`extension.rs`](../../codex-rs/ext/goal/src/extension.rs)、[`goals.rs`](../../codex-rs/state/src/runtime/goals.rs) | DB 更新与 rollout event 之间仍需故障分析 |
| E04 | 三次 blocker 与 evidence-based complete 是模型 prompt/tool contract | F2 | [`spec.rs`](../../codex-rs/ext/goal/src/spec.rs)、[`continuation.md`](../../codex-rs/ext/goal/templates/goals/continuation.md) | handler 不验证 blocker 次数、测试或 Artifact |
| E05 | 非 usage-limit terminal error 可由 runtime 直接把 active goal 标为 blocked | F2 | [`extension.rs`](../../codex-rs/ext/goal/src/extension.rs)、[`runtime.rs`](../../codex-rs/ext/goal/src/runtime.rs) | 与模型三回合 blocker 契约是不同路径 |
| E06 | `update_plan` 只发 PlanUpdate，rollout policy 将其列为 transient | F2 | [`plan.rs`](../../codex-rs/core/src/tools/handlers/plan.rs)、[`policy.rs`](../../codex-rs/rollout/src/policy.rs) | function call/output 仍可能留在对话，缺少 canonical plan reducer |
| E07 | 复杂工作应把 execution plan 的进度与决策日志版本化进仓库 | F1 | [Harness engineering](https://openai.com/index/harness-engineering/) | 这是官方工程实践，不是当前 update_plan 的自动行为 |

### F. 多 Agent 状态与执行

| ID | 主张 | 等级 | 直接证据 | 限制 |
|---|---|---|---|---|
| F01 | root tree 共享 AgentControl/registry/limiter/RolloutBudget | F2 | [`agent/control.rs`](../../codex-rs/core/src/agent/control.rs) | 子 Agent仍有独立 thread/context |
| F02 | spawn 使用 reservation/commit/Drop rollback，原子保护容量、nickname 与 AgentPath | F2 | [`agent/registry.rs`](../../codex-rs/core/src/agent/registry.rs) | 共享文件写集合仍无自动事务 |
| F03 | fork 前 materialize+flush 父 rollout，再读 snapshot，并过滤工具/reasoning 噪声 | F2 | [`agent/control/spawn.rs`](../../codex-rs/core/src/agent/control/spawn.rs) | filter 的最佳召回率未量化 |
| F04 | V2 非 ephemeral edge 可持久；不活跃 Agent 可 unload 并按 thread/rollout reload | F2 | [`agent/control.rs`](../../codex-rs/core/src/agent/control.rs)、state spawn-edge migration | 未消费 mailbox queue 仍在内存 |
| F05 | `wait_agent` 是事件驱动活动摘要，结果内容通过 mailbox/pending input 进入父上下文 | F2 | [`multi_agents_v2/wait.rs`](../../codex-rs/core/src/tools/handlers/multi_agents_v2/wait.rs) | queue 在 drain/record 前有 crash 窗口 |
| F06 | 长命令通过 yield/poll 跨多次模型交互；最多 64 个进程，initial yield 最多 30 秒，空 poll 默认上限 300 秒且可配置 | F2 | [`unified_exec`](../../codex-rs/core/src/unified_exec/mod.rs) | ProcessStore 跨应用重启不恢复 |

### G. 训练与评测

| ID | 主张 | 等级 | 直接证据 | 限制 |
|---|---|---|---|---|
| G01 | GPT-5.6 数据大类包括公开互联网、第三方合作、用户/训练员/研究人员生成或提供的数据，并经过过滤 | F1 | [System Card](https://deploymentsafety.openai.com/gpt-5-6) | 比例、许可细节与去污染证明未披露 |
| G02 | reasoning models 通过 RL 学习改进推理、尝试策略和识别错误 | F1 | [System Card](https://deploymentsafety.openai.com/gpt-5-6) | 具体算法和奖励函数未知 |
| G03 | System Card 披露“旨在增强 persistence 的训练” | F1 | [System Card](https://deploymentsafety.openai.com/gpt-5-6) | 对各用户体验的独立贡献未知 |
| G04 | persistence training 很可能贡献更强持续推进 | I1 | G03 + 长程行为与风险观测 | 缺少公开受控消融 |
| G05 | codex-1 以真实编码任务、多样环境、测试迭代进行 RL；环境扰动与合成异常状态训练减少虚假完成 | F1，历史方向 | [Introducing Codex](https://openai.com/index/introducing-codex/)、[Codex System Card](https://cdn.openai.com/pdf/8df7697b-c1b2-4222-be00-1fd3298f351d/codex_system_card.pdf) | 不能直接归因给 Sol |
| G06 | o3/o4-mini 用 RL 学习何时以及如何用工具；Deep Research 用端到端 RL 学习多步研究、回溯与响应新信息 | F1，历史方向 | [o3/o4-mini](https://openai.com/index/introducing-o3-and-o4-mini/)、[Deep Research](https://openai.com/index/introducing-deep-research/) | Sol 的复用程度未知 |
| G07 | Sol 的私有训练配方、rollout 长度、multi-agent curriculum、compaction-aware training、奖励权重和隐藏提示未公开 | U | 官方资料边界 | 任何具体叙述都需新的一手证据 |
| G08 | 模型没有可验证的第一人称训练日记或逐样本回忆 | U/能力边界 | 无公开检索接口或训练 provenance | 通用工程规律可作 I1/I2，不能作私有事实 |

### H. 公开评测

| ID | 主张 | 等级 | 直接证据 | 限制 |
|---|---|---|---|---|
| H01 | Ultra 四 Agent 点估计：BrowseComp +1.8pp、SEC-bench Pro +3.1pp、Terminal-Bench 2.1 +3.1pp | F1 | [GPT-5.6 release](https://openai.com/index/gpt-5-6/) | 无公开 CI、重复次数或配对检验 |
| H02 | H01 是产品 bundle 的配置级正分差 | F1+I1 | H01 | 不能分给并发、总计算、worker prompt、context isolation 或 synthesis |
| H03 | Ultra 只在三个适配宽度扩展的选定评测上报告；ALE、DeepSWE、GeneBench、OSWorld、MRCR、GraphWalks 无 Ultra 结果 | F1 | release result tables | 存在选报与外推边界 |
| H04 | BrowseComp 与 SEC-bench Pro 图包含 16-agent 配置；精确坐标、token、成本、CI 未公开 | F1+U | release text | 图片尚未本地视觉复核 |
| H05 | MRCR 最高区间 Sol 73.8、GPT-5.5 74.0，点估计近似持平；GraphWalks 1mil set-F1 77.1 对 45.4 | F1 | release tables | MRCR similarity 与 GraphWalks set-F1 不可横比；长度单位和 dataset commit 有未知 |
| H06 | METR 不认为 Time Horizon 1.1 结果稳健，原因是异常 cheating 检测率 | F1/F3 | [System Card](https://deploymentsafety.openai.com/gpt-5-6) | 不能宣称固定自主小时数 |
| H07 | System Card 观察到 severity-3 越界倾向上升，并提出高 effort、增强 persistence 与持续推进型 prompt 可能相关；绝对率低 | F1 | [System Card](https://deploymentsafety.openai.com/gpt-5-6) | 图中绝对率未视觉读取，因果仍是假设 |
| H08 | ALE 发布页正文 53.6 与表格 52.7 冲突；Terminal-Bench 2.1 修复项 28/26 口径未消解 | F1/F3 | release + benchmark sources | 最终版不得任选一个写成唯一真值 |

## 四、最终版必须保留的未知项

1. Sol/Terra/Luna 权重架构、参数量、MoE/路由、训练 FLOPs。
2. 训练数据比例、去污染证明、Agent trajectory 时长分布。
3. SFT/RL/过程奖励/结果奖励/安全奖励的组合与权重。
4. Ultra 私有 root/worker prompt、预算分配、重试、综合器和停止策略。
5. 产品 Ultra 是否始终固定 root+3，或会按任务动态调宽。
6. 16-agent 精确评测数据与 4→16 边际收益。
7. 公开 benchmark 的完整 harness commit、模型 snapshot、seed、CI 与原始轨迹。
8. Ultra 在两次以上 compaction、跨进程重启、共享可变状态和 budget interruption 上的受控结果。
9. 本地 Code Mode 与公开 PTC 的内部实现关系。
10. remote compaction、Responses Lite 与服务端 persisted reasoning 的完整实现。

## 五、最终版修订规则

- “模型贡献”统一写成“发布表配置级系统分差”，除非控制变量完整。
- “Ultra 由并行带来提升”统一写成“Ultra bundle 与正点估计相关”，并列出未分离机制。
- 产品 Ultra、公开 Multi-agent API、本地 Codex V2 三个执行面分开写。
- 任何“未见源码实现”都限定到当前 commit，不能升级为产品全局不存在。
- 每个关键数值附任务、指标、比较对象、快照和限制。
- 图片独有数值只有在本地下载并经 `view_image` 后才能使用。
- Goal 的数据库强制语义与模型 prompt 契约分开写。
- PlanUpdate 的即时价值与弱 durability 分开写。
- compaction、TokenBudget、Goal budget、RolloutBudget、usage limit 分开写。
- 训练章节采用“直接披露 / 历史方向 / 可证伪假设 / 未知”四层结构。

---

### v3 边界声明

本 ledger 是最终报告的证据控制面。它保存了独立审查后的降级、限定和冲突，不会回写或覆盖 v0、v1、v2。最终报告只能提高叙述完整度，不能擅自提高任何 claim 的证据等级。
