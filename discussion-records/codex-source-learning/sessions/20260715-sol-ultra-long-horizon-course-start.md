# Sol Ultra 长程 Agent 课程启动记录

## 结论

第一阶段从“长上下文、长程执行、可恢复性”三分法开始。该边界是继续学习 Multi-agent、rollout、compaction、Goal、预算路径、训练证据和 Harness 设计的共同前置知识。

## 已建立的课程状态

- `MISSION.md`：将成功标准改为可观察的分析与设计能力。
- `RESOURCES.md`：加入官方 Knowledge、实践社区、证据缺口和版本边界。
- `assets/course.css`：全课程共享、移动端与 A4 打印友好的视觉组件。
- `assets/quiz.js`：自动反馈、重试、总分和等长答案检查。
- `lessons/0001-long-context-long-horizon-recovery.html`：10–15 分钟第一课。
- `reference/sol-ultra-long-horizon-map.html`：术语、层级、状态载体和证据标签速查。

## 证据快照

- OpenAI 官方页面于 2026-07-15 重新核对：GPT-5.6 发布页、Sol 模型页、Responses Multi-agent、Compaction、Using Goals in Codex。
- 本地 final-v4 报告的官方网页快照截至 2026-07-12，源码基线为 `26f5998e`。
- 当前仓库 HEAD 为 `e623315e`，比报告基线前进 82 个提交；后续源码课不会把报告中的 F2 主张直接当作当前 HEAD 事实。
- 官方 Codex 手册抓取器返回 HTTP 403；Docs MCP 未暴露；本机 `codex mcp` 因 `service_tier = default` 的配置兼容问题无法加载。课程因此使用 OpenAI 官方域名页面做当日复核。

## 验收

- 本地 HTML/Markdown 引用：0 个缺失目标。
- 浏览器控制台：0 error / 0 warning。
- 测验：错误反馈、正确反馈、`4/4` 汇总和重置路径全部通过。
- 四题选项：每题均为 4 个 Unicode 汉字。
- JavaScript：`node --check` 通过。
- 视觉：1440×1000 桌面与 390×844 移动端截图已用原始分辨率检查，无可见裁切或横向溢出。
- 独立内容验收首轮发现 P1=2、P2=1：执行面关系越界、claim-level 标签不足、术语漂移。修订后复验为 GO，P0=0 / P1=0 / P2=0。
- 最终课程将 F1 产品事实、F2 `26f5998e` 快照、I1 条件化解释和 U 执行面关系拆开；统一使用“可恢复性”，并定义为可恢复执行能力。

视觉证据位于 `output/playwright/sol-ultra-course-20260715/`。

## 学习记录边界

当前只证明教材和反馈回路可用，尚未证明学习者掌握概念。学习者完成第一课的三条无提示复述并得到反馈后，才创建相关 `learning-records/0001-*`。

## 下一步

学习者需要提交三条答案：

1. Sol、`max`、Ultra、Goal/rollout 分别属于哪个层级。
2. 1.05M context 为什么无法证明跨中断 durability。
3. 一个应当写入项目 Artifact、无法只依赖 compaction 的事实。
