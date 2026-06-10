---
title: Codex 仓库地图
type: orientation
created: 2026-06-01
updated: 2026-06-01
tags:
  - orientation
  - repository-map
  - codex-monorepo
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/understand-graph-summary.json
  - derived-knowledge/raw/source-file-map.json
  - README.md
  - codex-rs/Cargo.toml
  - codex-rs/README.md
  - codex-rs/app-server/README.md
---

## 定义

`sss-codex` 是一个以 `codex-rs` Rust workspace 为重心的 Codex CLI monorepo。仓库地图的作用，是把读者从“文件树”带到“系统分区”：哪些目录承载 agent runtime，哪些目录承载 UI、app-server、MCP/tools、sandbox/security、SDK、release packaging，以及哪些目录只是证据、文档或本地知识覆盖层。

可以把这个仓库看成一座机场：`codex-rs/core` 是塔台，`codex-rs/tui` 与 `codex-rs/cli` 是旅客入口，`codex-rs/app-server*` 是另一套面向桌面端的航站楼，`codex-rs/codex-mcp` 与 `core-skills/core-plugins/connectors` 是外部航线，`sandboxing/execpolicy/shell-command/guardian` 是安检与跑道管制。`sdk/*` 和 `codex-cli` 则把同一能力包装给外部消费者。

## 为什么重要

第一层地图能降低误读成本。这个仓库里“工具”“权限”“turn”“thread”“session”“plugin”“connector”等词分布在多个 crate 和协议层；如果直接从某个文件开始读，很容易把一个 API 入口误认为全局控制点。仓库地图把概念放回承载它的目录，避免把局部实现当成总体架构。

一个实用划分是：

- `codex-rs/`: Rust 主体，包含 `codex-core`、`codex-protocol`、`codex-config`、`codex-tui`、`codex-app-server`、`codex-mcp`、`codex-sandboxing`、`codex-execpolicy` 等 crate。
- `codex-cli/`: npm facade，`bin/codex.js` 负责让包用户进入本机 native binary。
- `sdk/python/` 与 `sdk/typescript/`: 外部程序化调用面，围绕 app-server/exec 能力生成客户端层。
- `.github/`、`scripts/`: release、CI、package staging、repo ops。
- `docs/` 与 `codex-rs/*/README.md`: 用户文档与 crate 局部文档。
- `.codex/`、`wiki/`、`derived-knowledge/`: 本地 agent runbook、已有 wiki、派生知识层；它们是阅读材料和生成物，不能混作上游产品代码。

## 代码仓证据

- `README.md`: 顶层把项目定位为本地运行的 `Codex CLI`，并给出 install、usage、docs 入口。
- `package.json`: `name` 为 `codex-monorepo`，scripts 包含 schema 生成入口，`packageManager` 固定到 `pnpm@10.33.0...`。
- `codex-cli/package.json`: `name` 为 `@openai/codex`，`bin.codex` 指向 `bin/codex.js`，说明 npm 包是 CLI façade。
- `codex-rs/Cargo.toml`: workspace members 与 dependencies 中列出 `codex-core`、`codex-protocol`、`codex-config`、`codex-tui`、`codex-app-server`、`codex-mcp`、`codex-sandboxing`、`codex-execpolicy` 等关键 crate。
- `codex-rs/README.md`: 说明 Rust implementation 是 maintained Codex CLI，列出 `config.toml`、MCP client/server、`codex exec`、sandbox 子命令与 `--sandbox` 选项。
- `codex-rs/app-server/README.md`: 说明 `codex app-server` 使用 JSON-RPC 2.0 风格消息，列出 `thread/start`、`turn/start`、`mcpServer/tool/call`、`plugin/install`、`command/exec` 等 desktop-facing API。
- `derived-knowledge/raw/understand-graph-summary.json`: graph project 描述为 `OpenAI Codex CLI monorepo`，包含 Rust runtime crates、TypeScript CLI packaging、SDKs、tooling、documentation、CI、local wiki materials。

## 待验证问题

- `derived-knowledge/raw/understand-graph-summary.json` 的 baseline commit 是 `b14f11d3d2ca048bdae1872ef66087a2ce3f6b0c`；当前工作树若继续变化，页面应重新核对高变动目录。
- `codex-rs/core` 当前承担大量职责，AGENTS 指令要求抵制继续膨胀 `codex-core`。仓库地图只能说明现状，不能证明这些边界都是长期设计意图。
- `docs/` 与 `codex-rs/app-server/README.md` 在内容权威性上有差异：app-server API 文档明确由仓库维护；一般产品文档的最终权威可能在外部官方 docs，需要后续确认。
- `wiki/` 与 `derived-knowledge/` 均为本地知识层，应继续确认哪些内容可被未来 agent 当作 evidence，哪些只能当作 synthesis。

## Related

- [[orientation/understand-graph-baseline]]
- [[orientation/onboarding-tour]]
- [[orientation/key-files-to-read-first]]
- [[architecture/rust-workspace-shape]]
- [[architecture/core-agent-runtime]]
- [[architecture/sdk-and-release-surfaces]]
