---
title: Key Files To Read First
type: orientation
created: 2026-06-01
updated: 2026-06-01
tags:
  - orientation
  - key-files
  - evidence-map
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/understand-graph-summary.json
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/Cargo.toml
  - codex-rs/core/src/lib.rs
  - codex-rs/codex-mcp/src/connection_manager.rs
  - codex-rs/protocol/src/protocol.rs
  - codex-rs/protocol/src/models.rs
---

## 定义

这页给出第一批应读文件清单。选择规则采用 \(priority = centrality + security\_risk + entrypoint\_value\)：越能解释系统主干、越靠近安全边界、越能作为外部入口的文件，越早读。

清单按功能分组。它的目标是帮助读者建立可追踪证据链：从 README 到 workspace，从 core runtime 到 turn context，从 app-server API 到 MCP/tool surface，从 approval/sandbox 到 SDK/release。

## 为什么重要

大仓库里最危险的阅读方式，是随机打开复杂文件并立即推导全局设计。优先文件清单像一张“地基图”：先读地基、承重柱、楼梯和消防通道，再看房间布局。这样能减少三类误判：把 UI 现象当 runtime 事实、把协议字段当 enforcement、把文档意图当源码保证。

第一批建议控制在 30-50 个文件。低于这个数量会漏掉安全和外部入口，高于这个数量会把 onboarding 变成全仓扫描。

## 代码仓证据

阅读入口与仓库约束：

- `README.md` - `Codex CLI` install、usage、docs。
- `AGENTS.md` - Rust workflow、TUI style、app-server v2 API 规则。
- `package.json` - monorepo Node scripts 与 `pnpm` pin。
- `codex-rs/Cargo.toml` - Rust workspace members/dependencies。
- `codex-rs/README.md` - Rust CLI、MCP、sandbox、`codex exec`。

Core runtime 与 long-horizon 基础：

- `codex-rs/core/src/lib.rs` - `codex-core` module/export map，包含 `CodexThread`、`TurnContext`、`McpManager`、`RolloutRecorder`、`ThreadManager` 等 exports。
- `codex-rs/core/src/session/mod.rs` - `Codex`、`Codex::spawn`、`submit`、`submit_with_trace`、`submit_with_id`、approval/user-input handlers。
- `codex-rs/core/src/session/session.rs` - `Session`、`SessionConfiguration`、`SessionSettingsUpdate`，以及 `McpConnectionManager` 初始化路径。
- `codex-rs/core/src/session/turn.rs` - `run_turn`、`build_skills_and_plugins`、auto-compaction 相关函数。
- `codex-rs/core/src/session/turn_context.rs` - `TurnContext`，包含 cwd、permission profile、filesystem/network sandbox policy、reasoning effort 等 turn-local context。
- `codex-rs/core/src/codex_thread.rs` - `CodexThread` 与 thread-level submit/resume 生命周期。
- `codex-rs/core/src/thread_manager.rs` - `ThreadManager`、fork/resume/store/model manager。
- `codex-rs/core/src/rollout.rs` - rollout/session persistence exports 的源头。

Protocol、app-server 与 schema 面：

- `codex-rs/protocol/src/protocol.rs` - `AskForApproval`、`SandboxPolicy`、`ReviewDecision`、turn/event protocol types。
- `codex-rs/protocol/src/models.rs` - `PermissionProfile`、`SandboxPermissions`、`AdditionalPermissionProfile`。
- `codex-rs/protocol/src/permissions.rs` - `NetworkSandboxPolicy`、`FileSystemSandboxKind`、`FileSystemSandboxPolicy`。
- `codex-rs/protocol/src/approvals.rs` - `GuardianRiskLevel`、`ExecApprovalRequestEvent`、`ExecPolicyAmendment`。
- `codex-rs/app-server-protocol/src/protocol/v2/mod.rs` - v2 protocol module entry。
- `codex-rs/app-server-protocol/src/protocol/v2/mcp.rs` - `McpServerToolCallParams`、`McpServerStatus`、`McpServerElicitationRequest`。
- `codex-rs/app-server/src/lib.rs` - app-server runtime crate。
- `codex-rs/app-server/src/request_processors/mcp_processor.rs` - MCP status/list/read/tool-call request processors。
- `codex-rs/app-server/README.md` - JSON-RPC lifecycle、API overview、approvals、skills、apps。

MCP、tools、skills、plugins、connectors：

- `codex-rs/core/src/tools/mod.rs` - tool submodules `handlers`、`router`、`registry`、`runtimes`、`sandboxing` 等。
- `codex-rs/core/src/mcp_tool_call.rs` - `handle_mcp_tool_call`、approval/telemetry handling。
- `codex-rs/core/src/mcp_tool_exposure.rs` - `build_mcp_tool_exposure`。
- `codex-rs/codex-mcp/src/connection_manager.rs` - `McpConnectionManager`、`list_all_tools`、`call_tool`、resources/templates/read。
- `codex-rs/core-skills/src/loader.rs` - `SKILL.md` discovery、frontmatter parsing、skill roots。
- `codex-rs/core-plugins/src/loader.rs` - `load_plugins_from_layer_stack`、`into_mcp_servers`、plugin cache refresh。
- `codex-rs/plugin/src/lib.rs` - plugin capability summary types。
- `codex-rs/connectors/src/metadata.rs` - connector label/mention/install-url helpers。

Sandbox、exec、安全与 host integration：

- `codex-rs/core/src/exec_policy.rs` - `ExecPolicyManager::create_exec_approval_requirement_for_command`。
- `codex-rs/execpolicy/src/policy.rs` - `Policy::check_multiple_with_options`。
- `codex-rs/execpolicy/src/decision.rs` - `Decision::{Allow, Prompt, Forbidden}`。
- `codex-rs/shell-command/src/parse_command.rs` - shell command parsing。
- `codex-rs/shell-command/src/command_safety/is_safe_command.rs` - known-safe command logic。
- `codex-rs/shell-command/src/command_safety/is_dangerous_command.rs` - dangerous command heuristics。
- `codex-rs/shell-escalation/src/unix/escalation_policy.rs` - `EscalationPolicy` trait。
- `codex-rs/sandboxing/src/manager.rs` - `SandboxManager`、platform sandbox selection/transform。
- `codex-rs/sandboxing/src/seatbelt.rs` - macOS `sandbox-exec` argument construction。
- `codex-rs/sandboxing/src/landlock.rs` - Linux sandbox command args。
- `codex-rs/sandboxing/src/bwrap.rs` - bubblewrap support checks。
- `codex-rs/windows-sandbox-rs/src/process.rs` - Windows sandbox process spawn.
- `codex-rs/process-hardening/src/lib.rs` - `pre_main_hardening`。
- `codex-rs/core/src/guardian/review.rs` 与 `policy_template.md` - guardian risk/outcome review。

External surfaces：

- `codex-rs/cli/src/main.rs` - native CLI entry。
- `codex-rs/tui/src/lib.rs`、`chatwidget.rs`、`bottom_pane/mod.rs` - TUI entry and high-touch UI。
- `codex-cli/bin/codex.js` - npm native binary resolution。
- `sdk/typescript/src/exec.ts` - TypeScript SDK exec path。
- `sdk/python/src/openai_codex/_approval_mode.py` - Python SDK approval mode settings。
- `scripts/codex_package/layout.py`、`.github/workflows/rust-release.yml` - release/package layout。

## 待验证问题

- 该清单基于 graph 与当前源码抽样；如果后续页面深入某个子系统，应补读对应 tests 和 fixtures，尤其是 app-server schema fixtures、core integration tests、sandbox tests。
- `codex-rs/core/src/session/mod.rs` 很大，阅读时应优先定位符号，再下钻到相邻小模块，避免把 orchestration 文件当成所有职责的 owner。
- SDK 和 release surface 的安全风险需要另页确认，因为依赖 install scripts、native package layout、CI artifact provenance。
- 若当前工作树已偏离 graph commit，新增/移动文件需要纳入下一版清单。

## Related

- [[orientation/repository-map]]
- [[orientation/onboarding-tour]]
- [[architecture/core-agent-runtime]]
- [[architecture/mcp-tools-skills-connectors]]
- [[architecture/sandbox-exec-security-host-integration]]
- [[source/test-evidence-map]]
