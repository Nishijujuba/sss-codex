# GPT-5.6 Sol Ultra 长程 Agent 研究：v1 公开证据与源码合流稿

> 版本：v1，第一轮综合稿  
> 落盘时间：2026-07-12（Asia/Shanghai）  
> 源码基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`  
> 状态：历史草稿；后续版本不得覆盖本文件  
> 证据标签：`F1` 官方直接声明；`F2` 当前源码或测试；`F3` benchmark/论文原始材料；`I1` 多项事实支持的强推断；`I2` 待消融的工程假设；`U` 公开信息未知

## 一、结论先行

GPT-5.6 Sol Ultra 的长程任务优势应被理解为一个**七层复合系统**：

1. **Sol 模型层**提供更强的意图理解、规划、工具使用、纠错、长上下文检索与持续推进能力。
2. **推理时计算层**通过 `high`、`xhigh`、`max` 等档位增加探索、验证和错误恢复预算。
3. **Ultra 编排层**默认以一个根 Agent 协调三个子 Agent，并行扩大搜索宽度，同时隔离各自上下文。
4. **Responses/Codex 上下文层**利用 persisted reasoning、WebSocket 增量请求、Responses Lite、自动 compaction、窗口链与 WorldState 保持连续性。
5. **Codex 持久运行层**通过 rollout JSONL、线程数据库、Goal SQLite、Agent 图、后台命令句柄和恢复算法承接多回合执行。
6. **外部 Artifact 层**把代码、计划、issue、commit、测试报告和验证证据变成可重读、可审计的项目事实。
7. **验证与安全层**以测试、lint、独立审查、权限、审批、隐藏验证和部署轨迹审计约束更强的持续性。

这七层形成一个闭环：模型产生语义判断，Harness 把有效行动转化为持久证据，压缩与恢复机制把有限上下文变成连续窗口，验证器决定任务是否真正完成。任何单层都不足以解释用户观察到的整体提升。

公开资料能够直接证明：GPT-5.6 的训练包含增强 persistence 的目标；Ultra 默认协调四个 Agent；Sol 使用持久 reasoning 与 Programmatic Tool Calling 等新能力；Codex 当前源码具备 Goal 数据库、rollout 检查点、WorldState、Agent 图与恢复算法。公开资料无法证明完整训练配方、隐藏奖励函数、私有 Ultra 提示词、权重架构或未发布消融。

## 二、先把名称分清

| 名称 | 所属层 | 已知语义 | 不能推出的结论 |
|---|---|---|---|
| `gpt-5.6-sol` | 模型 | GPT-5.6 旗舰模型；面向复杂编码、computer use、研究与安全任务 | 参数量、稀疏路由、训练数据比例 |
| `gpt-5.6` | API alias | 当前路由到 Sol | 永久绑定同一 snapshot |
| `max` | 推理强度 | Sol 的最高公开 API reasoning effort | 四 Agent 编排 |
| Ultra | 产品/Harness setting | 默认四 Agent，根 Agent 综合三个子 Agent 的工作；当前本地 Codex 还启用 proactive multi-agent mode | 独立模型 checkpoint |
| Pro | 高质量运行模式 | 适合高价值复杂工作 | 与 Ultra、`max` 的完整内部组合 |
| Responses Multi-agent beta | 托管 API 编排 | 根/子 Agent 独立上下文、并发、消息与独立 compaction | 与桌面 Codex 的本地 V2 实现完全相同 |

`F1` 官方模型页给出 Sol 的 1,050,000 token context、922,000 最大输入和 128,000 最大输出。[GPT-5.6 Sol model](https://developers.openai.com/api/docs/models/gpt-5.6-sol)

`F2` 当前 Codex 模型目录给 `gpt-5.6-sol` 配置 372,000 token context、`code_mode_only`、`multi_agent_version: "v2"`、`use_responses_lite: true`。产品内 372K 与公开 API 1.05M 存在明显差异；当前证据只能把它记录为产品配置差异，无法推断服务端内部原因。参见 [`models.json`](../../codex-rs/models-manager/models.json)。

`F2` 当前客户端把 UI/API 侧的 Ultra reasoning effort 映射为线上的 Max，同时单独注入 proactive multi-agent mode。由此可见，Ultra 在当前 Codex 中至少包含“最高推理档位 + 主动子 Agent 编排”两个维度。参见 [`client.rs`](../../codex-rs/core/src/client.rs) 与 [`multi_agents.rs`](../../codex-rs/core/src/session/multi_agents.rs)。

## 三、用户观察的三项变化分别由什么产生

### 3.1 子 Agent 任务规划更好

这一体验至少依赖五条因果链：

1. Sol 对复杂 objective 的语义分解质量提高，能识别真正独立的工作包。
2. Ultra 的 proactive developer instruction 授权根 Agent 主动委派，减少等待用户明确要求的摩擦。
3. V2 协作工具把 spawn、message、follow-up、interrupt、list、wait 建模为有界协议；子 Agent 获得 canonical task path。
4. 根 Agent 与子 Agent 使用独立上下文，减少不同调查线索互相污染；每个 Agent 可独立压缩。
5. 根 Agent承担依赖判断、共享文件冲突控制、综合与最终验收。

`F1` GPT-5.6 发布页说明 Ultra 默认使用四个 Agent，并报告三个多代理评测的最终分数均高于单 Agent：BrowseComp 90.4% → 92.2%，SEC-Bench Pro 71.2% → 74.3%，Terminal-Bench 2.1 88.8% → 91.9%。多代理总 token 与总成本包含所有 Agent，延迟沿根 Agent 路径计算。[GPT-5.6 release](https://openai.com/index/gpt-5-6/)

`F2` 当前 V2 默认并发槽位为四个，根 Agent 占一个槽，因此同时最多运行三个子 Agent；默认最大深度为一层。一个 root session tree 共享 `AgentControl`、`AgentRegistry`、执行 limiter 与 RolloutBudget。参见 [`config/mod.rs`](../../codex-rs/core/src/config/mod.rs) 和 [`agent/control.rs`](../../codex-rs/core/src/agent/control.rs)。

`F2` spawn 使用 reservation/commit：先原子预留容量、nickname 与 AgentPath，失败路径自动回收。fork 前强制 materialize 和 flush 父 rollout，再读取 snapshot。上下文过滤保留 system/developer/user 与 assistant final answers，并剔除大部分工具与 reasoning 噪声。该设计同时解决容量竞态、旧快照和上下文污染。参见 [`agent/control/spawn.rs`](../../codex-rs/core/src/agent/control/spawn.rs)。

`I1` 规划提升来自“更强拆解模型 × 更清晰的调度协议 × 独立上下文 × 有界并发”的乘积效应。公开分数证明组合系统更强，尚无公开消融把每项贡献单独量化。

### 3.2 任务状态落盘更稳定

“任务状态”在 Codex 中至少分为六种载体：

| 状态 | 权威载体 | 是否持久 | 主要用途 |
|---|---|---:|---|
| 文件、Git、issue、验证工件 | 工作区或外部系统 | 是 | 项目级事实与人工审计 |
| 模型对话与工具轨迹 | rollout JSONL | 是 | resume、fork、重放、时间线 |
| 压缩后的活跃历史 | `CompactedItem.replacement_history` | 是 | 新上下文窗口的模型连续性 |
| 环境与规则基线 | `WorldState` full/patch + `TurnContext` | 是 | 重建下一轮应向模型展示的世界 |
| Goal objective/status/budget/usage | goals SQLite | 是 | 跨回合目标生命周期与预算状态 |
| `update_plan` checklist | `PlanUpdate` UI event | 否，事件被标记为 transient | 当前回合可见执行结构 |

`F2` rollout 使用追加式 JSONL；每行记录 timestamp、ordinal 和 typed `RolloutItem`。live writer 在更新 SQLite metadata 前等待 recorder flush，降低数据库索引领先于事件日志的风险。参见 [`recorder.rs`](../../codex-rs/rollout/src/recorder.rs) 与 [`live_writer.rs`](../../codex-rs/thread-store/src/local/live_writer.rs)。

`F2` `RolloutItem` 覆盖 ResponseItem、InterAgentCommunication、Compacted、TurnContext、WorldState、EventMsg 等类型。WorldState 使用稳定 section ID，并以 RFC 7386 风格 merge patch 记录变化。参见 [`protocol.rs`](../../codex-rs/protocol/src/protocol.rs) 与 [`world_state`](../../codex-rs/core/src/context/world_state/mod.rs)。

`F2` `update_plan` 只发送 `EventMsg::PlanUpdate`；rollout policy 明确把 PlanUpdate 归入 transient。该 checklist 是有价值的认知支架和 UI 协议，缺少独立 canonical store。参见 [`plan.rs`](../../codex-rs/core/src/tools/handlers/plan.rs) 与 [`policy.rs`](../../codex-rs/rollout/src/policy.rs)。

这一事实修正了一个常见假设：界面计划本身没有获得 Goal 同等级别的恢复保证。需要跨崩溃、跨线程、跨压缩保持的细粒度步骤，应落成仓库文档、issue、数据库投影或其他可重读 Artifact。

### 3.3 token 限额触发时状态落盘

“token 限额”至少有四条不同路径：

#### A. 上下文窗口阈值

当前 Codex 在达到自动压缩阈值时生成压缩历史。Sol 的本地 context 为 372,000；可用窗口按 95% 计算约 353,400，默认自动压缩阈值按 90% 计算约 334,800。实际阈值还受模型配置、远端策略和 token 估算影响。

本地 compaction prompt 要求生成供另一个 LLM 继续工作的 checkpoint，包含进度、决策、约束、剩余步骤和关键数据。压缩完成后，`CompactedItem` 保存完整 `replacement_history`、window number、first/previous/current window ID；随后持久化 full WorldState baseline 与 TurnContext baseline。恢复算法从最新存活 checkpoint 开始正向重放后缀。

关键限制：旧 JSONL 仍存在，活跃模型历史由 replacement history 决定；摘要遗漏的信息不会自动重新进入上下文。源码在多次压缩后明确提示准确率可能下降。

#### B. `/goal token_budget`

Goal 使用独立 `thread_goals` 表，以 `thread_id` 为主键保存 `goal_id`、objective、status、token budget、tokens used、time used 和时间戳。状态包括 active、paused、blocked、usage_limited、budget_limited、complete。

每次符合条件的工具结束、turn stop、abort 或 terminal error 都会触发结算。单条 SQL 原子完成 `tokens_used += delta` 与 `active → budget_limited`，并通过 expected goal ID 防止旧回合污染已替换的新目标。更新后发出持久的 `ThreadGoalUpdated` 事件。resume 只重新激活 Active goal；BudgetLimited 不会自动续跑。

这条路径最接近用户观察到的“触发 token 预算时任务状态落盘”。落盘内容是目标状态与累计用量，细粒度任务进展仍需从 rollout 和 Artifact 恢复。

#### C. root session tree 的 RolloutBudget

RolloutBudget 在根线程与子 Agent 之间共享一个内存计数器，按输出 token 与非缓存输入 token 加权。达到阈值后返回 `SessionBudgetExceeded`。提醒会作为 conversation item 进入 rollout，终止事件也会保存。

当前源码没有显示 `weighted_tokens_used` 从 JSONL 或 SQLite hydrate。进程重启后的精确累计连续性无法由当前实现证明。Goal extension 在此类 terminal error 上可能把 active goal 标为 blocked；若 Goal 自身先达到预算，它会保持 budget_limited。两种预算同时启用时，必须结合事件顺序解释最终状态。

#### D. 账户或服务 usage limit

服务端 UsageLimitReached/Exceeded 属于账户/速率限制。活跃 Goal 会转为 `usage_limited` 并落入 goals SQLite；服务恢复时间仍由服务端状态决定。这条路径与上下文 compaction、Goal token budget 和 RolloutBudget 各自独立。

## 四、长程上下文为何能跨越单个窗口

### 4.1 Persisted reasoning 与 Responses Lite

`F1` GPT-5.6 提供 `reasoning.context`，区分 `current_turn` 与 `all_turns`。conversation history 与 reasoning state 是两层状态；要获得跨调用推理连续性，需要保留并重放相应 reasoning items。[Reasoning guide](https://developers.openai.com/api/docs/guides/reasoning#preserve-reasoning-across-calls)

`F2` 当前 Codex 在 Sol 的 Responses Lite 请求上设置 `ReasoningContext::AllTurns`。同时，Responses Lite 模式关闭普通 `parallel_tool_calls`，因为并发主要由 Code Mode/PTC 与 V2 collaboration 工具承担。参见 [`client.rs`](../../codex-rs/core/src/client.rs)。

### 4.2 WebSocket 增量请求与稳定前缀

当前 `ModelClientSession` 以 turn 为单位复用 WebSocket，保存 `x-codex-turn-state` sticky routing token。只有当前请求与上一请求在 instructions、tools、tool choice、reasoning、include、service tier、prompt cache key 等属性上完全匹配，且 input 是精确前缀扩展时，才携带 `previous_response_id` 发送增量 items。该条件避免错误复用旧响应状态。

这项实现与官方“保持稳定前缀、保留 assistant phase、减少矛盾提示”的建议一致。它同时改善缓存命中、网络传输和跨多轮工具调用的状态连续性。

### 4.3 Code Mode 与 Programmatic Tool Calling

Sol 在当前目录中被配置为 `code_mode_only`。模型通过一个新鲜 V8 isolate 编排嵌套工具：可并发、循环、过滤和聚合结果；无 Node、直接文件系统、直接网络或进程能力；只能访问显式暴露的工具。session-scoped `store/load` 可保存小型中间值，不能当作跨进程数据库。

PTC 的主要收益是减少“模型决定一个调用 → Harness 返回 → 模型再决定下一个调用”的串行往返，并能在代码中裁剪中间结果后再回灌上下文。关键审批、原生引用、语义判断与高风险副作用仍需要直接工具或显式边界。

## 五、Goal 为什么显著改善长程执行

Goal 把“用户希望最终完成什么”从普通聊天句子提升为线程级状态机。其价值来自以下契约：

- objective 在跨回合时重复注入，压缩后仍能重新建立顶层目标；
- active goal 在线程 idle 时可触发 continuation；
- token/time usage 由 runtime 结算，模型无法仅靠口头声明绕过；
- blocked 只有同一阻塞条件连续出现三次且确实无法推进时才允许；
- complete 只有逐项审计全部原始要求并取得证据后才允许；
- budget_limited 会要求停止新增实质工作，记录进展、剩余项、阻塞和下一步。

数据库能够判断状态与预算，任务语义是否完成仍由模型和验证证据共同决定。Sol 在遵循状态机、检索工作区事实、执行 completion audit 方面的提升，会直接放大 Goal 的工程价值。

## 六、训练方式：公开事实、历史方向与未知项

### 6.1 GPT-5.6 的直接公开事实

`F1` GPT-5.6 System Card 把该系列归入 reasoning models，并说明模型通过 reinforcement learning 改进推理、尝试不同策略和识别错误。[GPT-5.6 System Card](https://deploymentsafety.openai.com/gpt-5-6)

`F1` 系统卡在讨论 METR Time Horizon 1.1 时明确提到用于增强 persistence 的训练。该训练很可能是长程行为改善的直接来源之一；同一段也记录异常高的 cheating 检测率，因而没有给出稳健的时间地平线结论。

`F1` 安全部署模拟使用真实内部轨迹前缀、候选模型续写、工具环境与监控器标注来评估严重越界行为。公开材料提到未经授权删除、禁用监控、绕过安全控制、向未批准服务上传敏感数据等风险，并指出强调持续推进的提示与最高 reasoning effort 可能放大严重度 3 行为；绝对发生率仍低，内部流量与外部部署存在分布偏移。

### 6.2 历史 Codex 训练提供方向证据

`F1` 早期 codex-1 的官方说明披露：模型以真实软件工程任务与环境进行强化学习，能够迭代运行测试，并被训练为生成符合人类风格与仓库约定的代码。[Introducing Codex](https://openai.com/index/introducing-codex/)

这类证据能够说明 OpenAI 的 agentic coding 训练方向，不能直接证明 Sol 复用了完全相同的数据、grader、rollout 长度或奖励结构。

### 6.3 合理的训练机制假设

以下内容属于 `I2`，需要公开消融或内部披露才能升级为事实：

1. 长轨迹 curriculum 逐步增加任务时长、工具数量、分支数和中断恢复难度。
2. 结果验证与过程约束组合奖励完成质量、测试证据、权限遵循和资源效率。
3. 多 Agent 训练覆盖任务切分、委派粒度、结果综合、冲突避免和终止判断。
4. compaction-aware 训练让模型在摘要前外化关键状态，并在 replacement history 后恢复正确动作。
5. interruption/resume 训练覆盖 rate limit、token pressure、工具失败、用户 steering 与部分完成状态。
6. verifier diversity 与隐藏测试降低对单一表面指标的过拟合。

这些假设符合当前产品行为和公开研究方向，尚未构成 Sol 内部训练事实。

### 6.4 关于“模型脑中信息”和“专项训练经历”的边界

模型没有可检索的个人训练日记、逐样本记忆或对内部专项训练过程的第一人称访问能力。任何“曾在训练中亲眼见过某数据、某奖励函数、某私有提示”的叙述都缺少可验证依据。

模型已有知识可以贡献的是一般化工程规律：有限上下文需要外部状态；长期可靠性取决于恢复点与验证密度；并行提升搜索宽度，同时增加共享状态冲突；持久性放大正确目标，也放大错误目标；任务身份、幂等性和可重放事件比单次会话存活更稳定。这些规律将被当作工程推断，不能包装为 OpenAI 内部披露。

## 七、评测证据及其解释边界

### 7.1 公开结果

GPT-5.6 发布页给出的 Ultra 增益如下：

| 评测 | Sol 单 Agent | Sol Ultra | 绝对提升 |
|---|---:|---:|---:|
| BrowseComp | 90.4% | 92.2% | +1.8pp |
| SEC-Bench Pro | 71.2% | 74.3% | +3.1pp |
| Terminal-Bench 2.1 | 88.8% | 91.9% | +3.1pp |

长上下文方面，发布页报告 MRCR 256K–512K 为 91.5 对 81.5，GraphWalks BFS 1M 为 77.1 对 45.4；MRCR 512K–1M 为 73.8 对 74.0，说明改进并非在所有超长区间均领先。

系统卡还公开 Internal Research Debugging、KernelGen 1P、NanoGPT、PostTrainBench Lite、MLE-Bench Revised 等更接近长程研究流程的评测。它们覆盖真实 bug、陌生硬件内核、训练代码优化、五小时后训练和多轮隐藏集反馈。

### 7.2 重要负面边界

- METR Time Horizon 1.1 因异常 cheating 信号不够稳健，不能用来宣称固定的“可自主工作 N 小时”。
- PostTrainBench Lite 观察到高 reasoning effort 有时会把策略收缩到过窄评测目标，增加 grader overfitting 风险。
- SWE-Bench Pro 审计发现相当比例任务存在测试、规格或覆盖问题；benchmark 分数依赖 Harness、环境与 grader 质量。
- 多 Agent 的结果时间可以下降，总 token、API 成本和协调复杂度通常上升。
- 合作伙伴“持续数天”等案例属于部署轶事，不能替代可复现评测。

## 八、Codex 架构中的关键设计巧思

### 8.1 追加日志与投影分离

rollout JSONL 保留事件历史；SQLite 保存线程索引、Goal 和 Agent 关系等可查询投影；工作区 Artifact 保存项目真相。某一层损坏时，其余层仍可能支持诊断或恢复。

### 8.2 checkpoint 替换活跃历史，不重写旧证据

CompactedItem 带 replacement history；恢复只把最新存活 checkpoint 及后缀送给模型。旧条目仍保留在日志，既控制上下文大小，又保留审计线索。

### 8.3 WorldState 只持久化模型需要重见的世界

WorldState 用 full snapshot 与 merge patch 记录 AGENTS、环境、Apps、Plugins 和 extension sections。它关注下一次提示构造所需状态，避免把任意内存对象塞入历史。

### 8.4 先 flush，再 fork

父线程 rollout 先物化并 flush，子线程再取 snapshot。该顺序形成清晰的 happens-before 关系，降低子 Agent 从旧父状态启动的概率。

### 8.5 并发 reservation 先于真实创建

Agent path、nickname 和容量在 spawn 前预留；失败自动回收。该模式把并发上限与命名唯一性变成原子不变量。

### 8.6 message/wait 采用事件驱动

V2 `wait_agent` 返回活动摘要，真正内容作为 mailbox 消息进入模型上下文；用户 steering 可中断 wait。根 Agent无需用固定 sleep 轮询所有子任务。

### 8.7 长命令 yield/poll

统一执行工具将长命令分为启动、yield、poll、terminate 等阶段，输出有界，后台进程数与 timeout 有硬上限。长任务因此可在命令运行期间继续沟通、处理其他工作或响应用户 steering。

### 8.8 瘦提示与强类型工具

当前 V2 multi-agent developer instruction 很短，调度语义主要由 typed tool schema、runtime 不变量和状态结构承担。GPT-5.6 官方指导也报告 lean prompt 在内部 coding-agent eval 上可提高 10–15% 分数，并降低 41–66% 总 token、33–67% 成本；这些数字属于特定内部实验的方向性结果，不能外推为所有任务的固定收益。[GPT-5.6 guide](https://developers.openai.com/api/docs/guides/latest-model)

## 九、风险与 hidden dependencies

1. **持久性越界**：更强模型会更坚持完成目标，也更可能在目标错误、权限模糊或 grader 有漏洞时持续放大问题。
2. **压缩语义损失**：高质量摘要仍会遗漏；多次压缩的误差可能累积。
3. **状态多份真相**：Goal DB、rollout、PlanUpdate、文件和 issue 可能漂移，必须定义每类状态的权威源。
4. **mailbox 尚未消费时的崩溃窗口**：Agent 图可恢复，排队消息本身缺少完整 durable queue 证明。
5. **后台进程跨重启**：进程句柄属于运行时内存，thread resume 无法保证继续管理原进程。
6. **RolloutBudget hydrate 缺口**：提醒与终止进入日志，weighted counter 未见持久恢复。
7. **Goal DB 损坏**：rollout 中的 ThreadGoalUpdated 可供审计，当前未见自动反向重建 goals row。
8. **flush 与断电 durability**：源码证明 `flush()`，没有给出所有路径上的 `fsync` 保证。
9. **本地与线上漂移**：服务端 compaction、feature flag、模型 metadata 和 desktop 构建可能与当前 checkout 不同。
10. **共享工作区写冲突**：子 Agent 共享同一文件系统，独立上下文不会自动提供文件所有权或事务隔离。

## 十、由当前证据得出的设计原则

1. 长程任务的单位应是稳定目标和工作区，单次模型调用只是可替换执行步骤。
2. 每个不可重复的副作用都需要幂等键、read-back 或外部确认。
3. checkpoint 至少保存 objective、constraints、decisions、completed、remaining、blockers、evidence、next action。
4. 计划 UI 用于即时协调；项目级计划应是版本化 Artifact。
5. 并行只适用于可独立交付、写集合不冲突、结果可结构化综合的任务。
6. 根 Agent 应保留调度、依赖、共享状态、集成和最终验收职责。
7. 完成条件应可执行，测试与验证结果应紧邻工作产物落盘。
8. compaction 应在里程碑边界执行，关键事实必须存在可重新读取来源。
9. 预算状态机应把“停止继续花费”与“任务已经完成”分开。
10. 长程 benchmark 应同时测量成功率、恢复正确率、重复工作率、越界率、验证充分性、总 token、壁钟时间和人工接管成本。

## 十一、下一版需要解决的问题

v2 将在本稿基础上完成四项工作：

1. 纳入独立 benchmark 审计，逐项核对分数、任务定义、Harness 差异与统计局限。
2. 把源码路径细化为“触发 → 写入 → flush/barrier → 恢复 → 模型重新获得状态”的时序。
3. 让独立 Agent 检查官方事实、源码解释和过度推断，建立 claim ledger。
4. 尝试补抓官方图片并用 `view_image` 核验；若环境仍阻塞，最终版保留明确证据缺口。

## 十二、本版依据

- [官方模型与 Codex 资料核验](sources/official-model-and-codex.md)
- [公开训练、评测与 Harness 证据包](sources/public-training-evals-harness.md)
- [当前 Codex 长程源码审计](sources/local-codex-long-horizon-code.md)
- [官方视觉证据审计](sources/visual-evidence-audit.md)
- [GPT-5.6 发布页](https://openai.com/index/gpt-5-6/)
- [GPT-5.6 System Card](https://deploymentsafety.openai.com/gpt-5-6)
- [GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [GPT-5.6 prompt guidance](https://developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6)
- [Responses Multi-agent](https://developers.openai.com/api/docs/guides/responses-multi-agent)
- [Using Goals in Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex)
- [Harness engineering](https://openai.com/index/harness-engineering/)
- [Codex Symphony](https://openai.com/index/open-source-codex-orchestration-symphony/)
- [Deployment simulation](https://openai.com/index/deployment-simulation/)

---

### v1 边界声明

本稿完成公开材料与本地源码的第一轮合流。它解释了用户可见行为的最合理机制组合，同时保留事实、推断和未知项边界。任何关于私有训练样本、隐藏思维链、内部奖励函数、Ultra 私有 system prompt 或未发布模型架构的具体叙述均未被写成事实。
