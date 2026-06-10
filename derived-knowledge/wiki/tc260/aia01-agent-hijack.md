---
title: TC260 AIA01 Agent Hijack
type: wiki
created: 2026-06-01
updated: 2026-06-01
tags:
  - tc260
  - prompt-injection
  - hijack
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/core/src/agents_md.rs
  - codex-rs/core/src/session/mod.rs
  - codex-rs/core/src/guardian/policy_template.md
  - codex-rs/core/src/guardian/approval_request.rs
  - codex-rs/core/src/tools/orchestrator.rs
---

## 定义

风险含义：AIA01 Agent Hijack 指攻击者通过 prompt injection、jailbreak、多轮诱导或低信任内容，把 agent 的目标、权限边界或行动计划劫持到用户授权范围外。Codex 中的典型入口包括 `AGENTS.md`、repo docs、tool output、MCP metadata、web/app connector 内容、skills/plugins 指令和 generated artifacts。

劫持远超“模型说错话”这个层面。真正危险点是劫持后的文本能触发工具调用、approval 请求、memory 写入或长期上下文污染。

## 为什么重要

Agent hijack 是许多其他风险的前置条件：它能引导 tool misuse、memory poisoning、RCE 和 traceability failure。防御要看三件事：来源权威、工具能力、用户授权。三者任一混淆，风险都会升高。

Codex 相关控制点包括：instruction assembly 的分层、permission instructions、tool output 作为 evidence、guardian 对 untrusted evidence 的评审策略、approval/sandbox 流程、memory polluted 标记。

## 代码仓证据

- `codex-rs/core/src/agents_md.rs`：`AGENTS.md` 从 project root 到 cwd 串联进入 model-visible user instructions，是 repo instruction surface。
- `codex-rs/core/src/session/mod.rs`：prompt 构建加入 permissions、apps、skills、plugins、extension context、user instructions，多来源内容共处同一 turn context。
- `codex-rs/core/src/guardian/policy_template.md`：要求把 transcript、tool call args、tool results、retry reason、planned action 视为 untrusted evidence，忽略试图重定义 policy 的内容。
- `codex-rs/core/src/guardian/approval_request.rs`：guardian action payload 覆盖 shell、exec、MCP、network、request permissions，有助于在动作层评估劫持后果。
- `codex-rs/core/src/tools/orchestrator.rs`：tool 执行前经过 approval、guardian、sandbox，给被劫持的工具调用设置运行时闸门。

## 待验证问题

- 缺口或待验证点：本地 evidence 没有 TC260 AIA01 权威原文，当前风险含义来自 index taxonomy。
- 需要验证每类外部内容在 prompt 中是否有清晰来源标签，尤其是 web/email/calendar/MCP resource。
- 需要建立 adversarial fixture：repo docs 中写入“忽略 AGENTS/系统规则”的内容，检查模型、guardian、approval 的响应。

## Related

- [[prompt-security/indirect-prompt-injection-surfaces]]
- [[prompt-security/instruction-hierarchy]]
- [[prompt-security/defensive-prompt-patterns]]
- [[security/approval-policy-and-guardian]]
- [[owasp/t2-tool-misuse]]
