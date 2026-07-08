---
title: MCP Tools Skills Connectors
type: architecture
created: 2026-06-01
updated: 2026-06-01
tags:
  - architecture
  - mcp
  - tools
  - skills
  - connectors
sources:
  - derived-knowledge/index.md
  - derived-knowledge/raw/understand-graph-summary.json
  - derived-knowledge/raw/source-file-map.json
  - codex-rs/codex-mcp/src/connection_manager.rs
  - codex-rs/core/src/tools/mod.rs
  - codex-rs/core/src/mcp_tool_call.rs
  - codex-rs/core/src/mcp_tool_exposure.rs
  - codex-rs/core-skills/src/loader.rs
  - codex-rs/core-plugins/src/loader.rs
  - codex-rs/connectors/src/metadata.rs
  - codex-rs/app-server/README.md
---

## 定义

这页覆盖 Codex 的外部能力面：`MCP` servers 提供工具/资源/模板，`tools` 是 core runtime 可调度的能力集合，`skills` 是带 `SKILL.md` frontmatter 的本地指导与依赖声明，`plugins` 是打包 skills/hooks/apps/MCP server metadata 的 bundle，`connectors` 则把 app 身份、mention slug、install URL 等用户可见入口连接起来。

可以把它理解为一套“港口系统”：`McpConnectionManager` 是码头调度，`ToolRouter` 和 tool handlers 是装卸线，`core-skills` 是操作手册，`core-plugins` 是集装箱清单，`connectors` 是海关登记与应用入口。任一层出错，都可能导致工具暴露过多、调用对象不清、approval 元数据缺失或审计链断裂。

## 为什么重要

MCP/tools/skills/connectors 是 agent 能力扩张最快的地方。这里既包含真正执行的 `call_tool`，也包含描述性 metadata、mention syntax、plugin install/cache、skill discovery、app-server API。安全上，能力扩张意味着攻击面扩张：工具列表可被误导，参数可过宽，connector 身份可混淆，plugin/skill 文本可携带指令。

工程上，边界同样关键。仓库规则要求 MCP tool calls 的 mutation 尽量靠近 `codex-rs/codex-mcp/src/connection_manager.rs`；这说明工具状态和调用应集中在 connection manager 处理，减少把 server/tool/auth 状态穿透到多层调用栈。

## 代码仓证据

- `codex-rs/codex-mcp/src/connection_manager.rs`: `McpConnectionManager` 拥有运行中的 async RMCP clients；方法包括 `new_uninitialized`、`new`、`has_servers`、`list_all_tools`、`list_all_resources`、`list_all_resource_templates`、`read_resource`、`call_tool`、`server_origin`、`server_pollutes_memory`、`plugin_id_for_mcp_server_name`。
- `codex-rs/core/src/tools/mod.rs`: tool 子模块包括 `handlers`、`hosted_spec`、`lifecycle`、`network_approval`、`orchestrator`、`parallel`、`registry`、`router`、`runtimes`、`sandboxing`、`tool_search_entry`；公开 `ToolRouter`。
- `codex-rs/core/src/mcp_tool_exposure.rs`: `build_mcp_tool_exposure` 负责构造 MCP tool exposure，并包含 filter non-Codex-app / Codex-app tools 的逻辑。
- `codex-rs/core/src/mcp_tool_call.rs`: `handle_mcp_tool_call` 与 `handle_approved_mcp_tool_call` 是 core 层 MCP 调用处理点，另有 `emit_mcp_call_metrics`、`record_mcp_result_span_telemetry`。
- `codex-rs/core-skills/src/loader.rs`: `SKILLS_FILENAME = "SKILL.md"`；`SkillRoot`、`skill_roots`、`repo_agents_skill_roots`、`discover_skills_under_root`、`extract_frontmatter` 说明技能来自目录扫描和 YAML frontmatter。
- `codex-rs/core-plugins/src/loader.rs`: `load_plugins_from_layer_stack`、`into_mcp_servers`、`remote_installed_plugins_to_config`、`refresh_curated_plugin_cache`、`materialize_marketplace_plugin_source` 说明 plugin 能转成 MCP server config，并带 marketplace/cache 逻辑。
- `codex-rs/core-plugins/src/marketplace_add/install.rs`: `safe_marketplace_dir_name`、`ensure_marketplace_destination_is_inside_install_root`、`marketplace_staging_root` 说明 install path 有目录安全检查。
- `codex-rs/connectors/src/metadata.rs`: `connector_display_label`、`connector_mention_slug`、`connector_install_url`、`sort_connectors_by_accessibility_and_name` 说明 connector 的 UI/mention/install metadata。
- `codex-rs/utils/plugins/src/mcp_connector.rs`: `is_connector_id_allowed`、`sanitize_name`、`sanitize_slug` 说明 MCP connector id/name 有白名单和清洗逻辑。
- `codex-rs/app-server/README.md`: API overview 包含 `plugin/installed`、`plugin/read`、`plugin/install`、`mcpServerStatus/list`、`mcpServer/resource/read`、`mcpServer/tool/call`；MCP approval elicitation meta 使用 `codex_approval_kind: "mcp_tool_call"`。

## 待验证问题

- `McpConnectionManager` 的方法列表证明它拥有 tool/resource/template/call 状态，但每一种调用何时需要 approval、何时污染 memory，需要结合 `mcp_tool_call.rs`、`mcp_approval_meta.rs` 和 tests 继续核验。
- `core-skills` 解析 `SKILL.md` frontmatter，当前页不能证明 skill body 的可信度模型。prompt-security 页面应补上 untrusted instruction 与 skill authority 边界。
- plugin install/cache 路径有目录检查，但 supply-chain 风险仍需验证：下载源、版本 pin、manifest trust、bundled hooks/apps/MCP 的启用条件。
- connector metadata 证明 UI 与 mention 入口存在；实际身份认证、OAuth、connector permissions 需要 app-server auth endpoints 与 connector runtime 继续补证。

## Related

- [[tools/mcp-connection-manager]]
- [[tools/tool-call-lifecycle]]
- [[tools/plugin-skill-loading]]
- [[tools/connector-identity-and-permissions]]
- [[security/tool-use-control-plane]]
- [[security/supply-chain-and-plugin-risk]]
