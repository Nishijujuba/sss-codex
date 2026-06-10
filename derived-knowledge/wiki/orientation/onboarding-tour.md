---
title: Codex Onboarding Tour
type: orientation
created: 2026-06-01
updated: 2026-06-01
tags:
  - orientation
  - onboarding
  - reading-order
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/understand-graph-summary.json
  - derived-knowledge/raw/source-file-map.json
  - README.md
  - AGENTS.md
  - codex-rs/README.md
  - codex-rs/app-server/README.md
---

## 定义

Onboarding tour 是基于当前 Understand graph 的十步阅读路线。它回答“新读者先看什么、随后沿哪条主线深入”。tour 是阅读路径，不能当作程序调用顺序；它像一次仓库导览，从总览牌开始，经过核心机房、控制台、工具接口和安全边界，最后进入外部 SDK 与本地知识层。

当前 tour 的核心顺序为：Repository Orientation -> Rust Workspace Shape -> Agent Core Loop -> Native CLI and TUI -> NPM Facade and Native Package Layout -> App Server API -> Tools, MCP, Plugins, and Skills -> Sandbox and Execution Policy -> SDKs and Release Automation -> Documentation and Local Wiki。

## 为什么重要

Codex 仓库的难点在于多入口和多控制面并存：同一个“turn”可能从 TUI、app-server、SDK 或 exec 路径进入；同一个“tool call”可能经过 hosted tools、MCP、dynamic tool、plugin skill、connector app；同一个“permission”可能在 `AskForApproval`、`PermissionProfile`、`SandboxPolicy`、execpolicy、guardian 中出现。tour 先建立空间感，再让读者追踪具体机制。

一个有效入门节奏是：

1. 先读 `README.md`、`AGENTS.md`、`package.json`、`codex-rs/Cargo.toml`，建立仓库契约与工作流规则。
2. 再读 `codex-rs/core/src/lib.rs`、`codex-rs/protocol/src/lib.rs`、`codex-rs/config/src/lib.rs`，识别 runtime/protocol/config 三角形。
3. 继续读 `codex-rs/core/src/session/mod.rs`、`turn.rs`、`turn_context.rs`、`tools/context.rs`，理解 turn 如何携带 cwd、model、approval、sandbox、tools。
4. 转到入口层：`codex-rs/cli/src/main.rs`、`codex-rs/tui/src/lib.rs`、`chatwidget.rs`、`bottom_pane/mod.rs`。
5. 看包装层：`codex-cli/bin/codex.js`、`codex-cli/scripts/build_npm_package.py`、`scripts/codex_package/layout.py`、`codex-rs/install-context/src/lib.rs`。
6. 看 desktop/API 层：`app-server-protocol/src/protocol/v2/mod.rs`、`app-server/src/lib.rs`、`thread-store/src/lib.rs`。
7. 看 tool 面：`codex-mcp/src/connection_manager.rs`、`core/src/tools/mod.rs`、`core-skills/src/lib.rs`、`plugin/src/lib.rs`、`connectors/src/lib.rs`。
8. 看安全执行面：`shell-command`、`shell-escalation`、`sandboxing`、`execpolicy`、`ext/guardian`。
9. 看 SDK 和 release：`sdk/typescript/src/exec.ts`、`scripts/stage_npm_packages.py`、`.github/workflows/rust-release.yml`。
10. 以 `docs/contributing.md`、`docs/install.md`、`wiki/wiki/overview.md`、`wiki/wiki/conventions.md` 收束。

## 代码仓证据

- `derived-knowledge/raw/understand-graph-summary.json`: `tour[0].title = "Repository Orientation"`，nodeIds 包含 `document:README.md`、`document:AGENTS.md`、`config:package.json`、`config:codex-rs/Cargo.toml`。
- `derived-knowledge/raw/understand-graph-summary.json`: `tour[2].title = "Agent Core Loop"`，nodeIds 包含 `file:codex-rs/core/src/lib.rs`、`session/mod.rs`、`turn_context.rs`、`tools/context.rs`。
- `derived-knowledge/raw/understand-graph-summary.json`: `tour[6].title = "Tools, MCP, Plugins, and Skills"`，nodeIds 包含 `codex-rs/codex-mcp/src/connection_manager.rs`、`codex-rs/core/src/tools/mod.rs`、`codex-rs/core-skills/src/lib.rs`、`codex-rs/plugin/src/lib.rs`、`codex-rs/connectors/src/lib.rs`。
- `derived-knowledge/raw/understand-graph-summary.json`: `tour[7].title = "Sandbox and Execution Policy"`，nodeIds 包含 `codex-rs/shell-command/src/lib.rs`、`codex-rs/shell-escalation/src/lib.rs`、`codex-rs/sandboxing/src/lib.rs`、`codex-rs/execpolicy/src/lib.rs`、`codex-rs/ext/guardian/src/lib.rs`。
- `AGENTS.md`: 给出 Rust/codex-rs 工作流、TUI style、testing、app-server v2 API 规则，是读仓库前必须装载的本地约束。
- `codex-rs/app-server/README.md`: lifecycle overview 描述 initialize -> `thread/start` -> `turn/start` -> notifications 的桌面端阅读主线。

## 待验证问题

- tour 来源于静态图，不能覆盖所有运行入口。`codex exec`、TUI、app-server、SDK 的实际共享程度需要各自沿源码继续验证。
- `AGENTS.md` 的项目约束是本地工作规则，是否全部反映 upstream maintainers 的长期偏好需要从 PR 历史或 maintainer 文档确认。
- app-server README 标注了若干 experimental API；阅读 tour 可以定位它们，稳定性边界仍需逐项查 `#[experimental(...)]` 和 schema fixtures。
- local wiki 和 derived wiki 的互链策略尚未定稿，后续需要确认哪些页面应进入长期知识库。

## Related

- [[orientation/repository-map]]
- [[orientation/key-files-to-read-first]]
- [[architecture/core-agent-runtime]]
- [[architecture/app-server-desktop-api]]
- [[architecture/mcp-tools-skills-connectors]]
- [[architecture/sandbox-exec-security-host-integration]]
