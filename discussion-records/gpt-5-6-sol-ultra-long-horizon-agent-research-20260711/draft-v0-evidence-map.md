# GPT-5.6 Sol Ultra 长程代理研究：v0 证据地图

> 版本：v0（初始证据地图）  
> 落盘时间：2026-07-11  
> 仓库基线：`26f5998e172c4aed1e88800feb6b153df5c0fe51`  
> 状态：历史草稿，后续版本不得覆盖本文件

## 核心结论

用户观察到的长程任务提升，当前最合理的研究假设是一个复合系统效应：GPT-5.6 Sol 的模型能力、Ultra 的主动多代理编排、GPT-5.6 的跨轮 reasoning 与 token 效率、Codex 的上下文压缩和 rollout 持久化、Goal 的线程级持久状态，以及宿主端的续跑与恢复机制共同作用。

现阶段已有三项官方事实：

1. `gpt-5.6-sol` 是 Codex 官方推荐的 GPT-5.6 旗舰型号，定位覆盖复杂编码、computer use、研究与网络安全。
2. Ultra 是复合运行模式：它使用最高级推理，并允许 Codex 主动把合适工作委派给子代理。该模式无法被简化为单一的 `reasoning_effort` 标签。
3. GPT-5.6 的公开新增项包括 Multi-agent beta、persisted reasoning、显式 prompt caching、Max reasoning、Pro mode、token efficiency 与更强的意图理解。

## 待验证的因果分解

| 层级 | 初始假设 | 需要的证据 | 当前状态 |
| --- | --- | --- | --- |
| 模型 | Sol 更擅长开放式规划、工具使用、验证和大上下文跟进 | GPT-5.6 官方模型指南、系统卡、评测 | 部分证实 |
| 推理配置 | 更高推理预算提高计划、检查和错误恢复质量 | reasoning 指南、模型配置语义 | 部分证实 |
| Ultra 编排 | 主代理主动拆分任务，子代理拥有隔离上下文，根代理负责综合 | Ultra/Subagents/Multi-agent 官方文档与本地实现 | 官方语义已证实，源码待审计 |
| 跨轮状态 | persisted reasoning 改善多轮质量与缓存效率 | Responses API reasoning 文档 | 官方语义已证实，Codex 使用路径待审计 |
| 上下文管理 | compaction 在接近上下文上限时生成有损 handoff，并持久化替换历史 | Codex 当前源码、测试、rollout 格式 | 已有导航材料，待基线复核 |
| 任务目标 | Goal 把目标、生命周期、预算和进度作为线程级持久状态 | Goals cookbook、本地 goal extension | 官方语义已证实，源码待审计 |
| 恢复 | rollout JSONL、线程数据库和 reconstruction 支持 resume/fork | 当前源码与集成测试 | 待审计 |
| token 限额 | 达到 rollout/goal/context 限额时存在不同停止、压缩、记录路径 | rollout budget、goal budget、compaction 代码 | 待分别核验 |
| 训练 | 长程能力来自何种 RL、数据、环境与评测设计 | 官方研究、系统卡、技术报告 | 未知；禁止以经验口吻补齐 |

## 研究必须回答的问题

### A. 名称与产品边界

- `gpt-5.6-sol`、`gpt-5.6`、Sol、Max、Ultra、Pro、`reasoning_effort` 分别属于模型、别名、推理设置或 harness 模式中的哪一层？
- Ultra 在 ChatGPT desktop、Codex CLI、IDE 与 Responses API 中是否具有完全相同的实现语义？
- 子代理是否共享模型、工具、权限、文件系统、线程历史和 reasoning state？各自的边界是什么？

### B. 用户观察的真实因果链

- “子代理任务规划更好”由模型拆解能力、Ultra developer instructions、协作工具协议、默认并发数、根代理综合策略中的哪些部分贡献？
- “任务状态落盘”具体指 Goal state、plan、rollout transcript、CompactedItem、线程数据库、文件制品，还是若干机制的组合？
- “触发 token 限额时状态落盘”对应 context compaction、rollout budget、goal budget、API `max_output_tokens` 或桌面端 turn continuation 中的哪条路径？

### C. 训练与评测边界

- OpenAI 公开了哪些训练目标、工具使用训练、agentic coding 环境、RL 或 verifier 设计？
- 哪些长程 benchmark 能测出真实进步，哪些只测单次补丁生成？
- harness 改进与模型权重改进如何通过消融实验区分？公开材料是否提供消融？
- 私有训练数据、内部 curriculum、奖励函数、隐藏提示词和未发布消融均应列为未知项。

## 证据等级

最终报告将对每条关键主张使用以下标记：

- **F1 官方直接声明**：OpenAI 官方文档、博客、系统卡、API 规范。
- **F2 当前源码事实**：当前 commit 的实现、类型、测试或 schema。
- **F3 原始研究证据**：论文、benchmark 规范、官方仓库或可复现实验。
- **I1 强推断**：两个以上独立 F1/F2/F3 事实支持，仍缺少直接因果证明。
- **I2 工程假设**：符合 agent 系统经验，需要实验验证。
- **U 未知**：公开证据不足，禁止写成模型“亲历”或内部事实。

## 已定位的首批官方来源

1. [Models](https://learn.chatgpt.com/docs/models)：GPT-5.6 Sol/Terra/Luna、reasoning effort、Max 与 Ultra 的产品语义。
2. [GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model)：Multi-agent、persisted reasoning、prompt caching、Max、Pro、token efficiency、intent understanding。
3. [Multi-agent](https://developers.openai.com/api/docs/guides/responses-multi-agent)：根代理、子代理树、协作动作、并发、上下文隔离、HTTP/WebSocket 续接。
4. [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)：Codex 子代理配置、角色、模型与 reasoning 选择。
5. [Using Goals in Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex)：线程级持久目标、预算、事件驱动续跑和证据完成条件。
6. [Long-running work](https://learn.chatgpt.com/docs/long-running-work)：长程任务的结果、约束、完成定义与并行隔离建议。

## 已知风险

- 官方文档处于快速演进期，同一术语在桌面产品、Codex CLI 与 Responses API 中可能存在表述差异。
- 当前工作树包含用户对 `codex-rs/prompts/templates/compact/prompt.md` 的未提交修改；源码审计必须区分基线实现与本地实验修改。
- 上下文压缩具有信息损失。良好的 handoff 能提高恢复质量，无法等价于无损记忆。
- 多代理能缩短独立工作流的墙钟时间，也会增加 token 消耗、协调成本和共享文件竞争风险。
- 公开产品行为无法直接证明私有训练过程。最终报告会把训练部分分成“公开披露”“可推断机制”“未知内部细节”。

## 下一版进入条件

v1 只有在以下材料齐备后才会创建：

- GPT-5.6 与 Ultra 的官方来源表；
- 当前 commit 的 compaction、rollout、Goal、multi-agent、token budget 源码路径表；
- 公开训练与长程评测证据表；
- 对用户三项观察的初步因果矩阵。
