# sss-codex Agent Architecture and Security Knowledge Index

This index defines a wiki construction plan for understanding the Codex monorepo through two primary lenses:

- Long-horizon agent work: how Codex helps an agent plan, execute, recover, compact context, persist state, and keep progress legible across long tasks.
- Agent security: how Codex controls runtime behavior, command risk, tool use, memory integrity, prompt injection exposure, human approval, and auditability against OWASP Agent/LLM and TC260-TR-005-2026 style risks.

The source baseline is the existing Understand Anything code graph at `../.understand-anything/knowledge-graph.json`, plus repository docs and source files. Each linked page should eventually live under `wiki/` using the same slug, for example `[[security/approval-policy-and-guardian]]` maps to `wiki/security/approval-policy-and-guardian.md`.

## Reading Spine

- [[orientation/repository-map]] - The first-pass map of the Codex monorepo: Rust crates, CLI facade, app server, SDKs, tools, docs, and local knowledge overlay.
- [[orientation/understand-graph-baseline]] - What the existing code graph contains, how to read its layers, and which parts are reliable evidence for wiki construction.
- [[orientation/onboarding-tour]] - A guided reading order based on the current graph tour: README, AGENTS, Rust workspace, core loop, TUI, app server, MCP/tools, sandbox, SDKs, docs.
- [[orientation/concepts-glossary]] - A compact glossary for agent loop, turn, thread, session, tool call, sandbox, approval, compaction, memory, MCP, plugin, skill, and connector.
- [[orientation/key-files-to-read-first]] - The first 30-50 files to inspect, grouped by architecture and security importance.
- [[orientation/research-questions]] - Open questions that require human review before the wiki claims design intent, historical reasons, or security guarantees.

## Codebase Architecture

- [[architecture/rust-workspace-shape]] - The Rust workspace as the load-bearing structure: core runtime, protocol, config, CLI, TUI, app server, MCP, sandbox, and support crates.
- [[architecture/core-agent-runtime]] - Core session orchestration, turn processing, model/tool event flow, and runtime state.
- [[architecture/cli-tui-terminal-ux]] - Native CLI and TUI surfaces, terminal rendering, bottom pane, chat widget, wrapping, and user interaction flow.
- [[architecture/app-server-desktop-api]] - Desktop-facing RPC surface, thread APIs, turn APIs, experimental APIs, and TypeScript schema generation.
- [[architecture/mcp-tools-skills-connectors]] - MCP connection management, hosted tools, skills, plugins, apps, connectors, and tool-call mutation boundaries.
- [[architecture/sandbox-exec-security-host-integration]] - Command execution, sandbox policy, shell escalation, guardian checks, host process hardening, and platform-specific execution.
- [[architecture/sdk-and-release-surfaces]] - Python SDK, TypeScript SDK, npm package layout, native binary distribution, release workflows, and external consumer risks.
- [[architecture/tests-fixtures-snapshots]] - Snapshot tests, protocol fixtures, integration tests, and the repository's regression evidence model.
- [[architecture/local-knowledge-overlay]] - Existing local wiki/raw materials and how they relate to repository learning, agent harness research, and security analysis.

## Long-Horizon Agent Design

- [[long-horizon/thread-session-turn-model]] - Thread, session, turn, item, and event boundaries; how long tasks remain addressable across interruptions.
- [[long-horizon/turn-context-and-runtime-metadata]] - The role of turn context: cwd, date, approval policy, sandbox policy, model, truncation, and instructions.
- [[long-horizon/planning-and-goal-state]] - How user intent becomes plan, task state, checkpoints, and resumable progress.
- [[long-horizon/context-compaction-flow]] - Manual and automatic compaction, summary generation, truncation thresholds, and what survives context pressure.
- [[long-horizon/precompact-postcompact-hooks]] - `PreCompact` and `PostCompact` hooks as lifecycle boundaries for preserving or auditing state transitions.
- [[long-horizon/memory-read-write-consolidation]] - Memory read/write paths, consolidation, citations, local memory folders, and eligibility controls.
- [[long-horizon/rollout-trace-and-resume]] - Rollout JSONL, task_started/task_complete boundaries, turn history, interrupted work, and resume semantics.
- [[long-horizon/subagent-and-parallel-work]] - Subagent dispatch, batch work, main-agent synthesis, and the risk of state divergence in parallel analysis.
- [[long-horizon/tool-feedback-loop]] - Tool call outputs, verification commands, browser/dashboard checks, and how evidence updates the agent's next action.
- [[long-horizon/failure-recovery-patterns]] - How the system should recover from failed commands, blocked approvals, broken scans, stale graphs, and partial outputs.

## Agent Security Model

- [[security/security-control-map]] - The end-to-end safety pipeline: user intent, agent plan, tool request, command parsing, exec policy, approval, guardian, sandbox, and OS boundary.
- [[security/approval-policy-and-guardian]] - AskForApproval policies, granular approval, guardian risk labels, and the difference between risk classification and execution authorization.
- [[security/sandbox-policy-model]] - Read-only, workspace-write, external sandbox, danger-full-access, network policy, writable roots, and host boundary assumptions.
- [[security/dangerous-command-intent-detection]] - Dangerous command recognition, command segmentation, shell escalation, prefix approvals, and why command intent is harder than string matching.
- [[security/exec-policy-and-amendments]] - Exec policy decisions, proposed amendments, accept-for-session behavior, and policy drift risks.
- [[security/runtime-isolation-and-process-hardening]] - Sandboxing, process hardening, filesystem scope, network restrictions, child process behavior, and platform-specific weak points.
- [[security/tool-use-control-plane]] - Tool visibility, tool-call authorization, parameter-level controls, connector access, and audit hooks.
- [[security/human-approval-design]] - Human-in-the-loop controls, approval fatigue, review prompts, safety copy, and decision traceability.
- [[security/auditability-and-forensics]] - Logs, rollout traces, analytics facts, memory citations, signed/structured evidence, and post-incident reconstruction.
- [[security/supply-chain-and-plugin-risk]] - Plugin install, skill loading, connector metadata, dependency scripts, package releases, and third-party component review.

## Prompt Injection and Instruction Integrity

- [[prompt-security/instruction-hierarchy]] - System, developer, AGENTS, skill, tool, user, repo, and web instructions as competing authority layers.
- [[prompt-security/indirect-prompt-injection-surfaces]] - Untrusted files, docs, web pages, issue text, emails, calendar items, MCP tool descriptions, and code comments as instruction smuggling channels.
- [[prompt-security/repo-instruction-boundaries]] - How AGENTS.md, skill instructions, local memory, and generated docs should be scoped and interpreted.
- [[prompt-security/tool-output-as-untrusted-data]] - Treating command output, web output, MCP output, and generated artifacts as evidence with provenance rather than authority.
- [[prompt-security/context-poisoning-chain]] - Attack chain from untrusted repo content to persistent context influence, memory write, hook/config modification, and future turn corruption.
- [[prompt-security/defensive-prompt-patterns]] - Practical guardrails: quote boundaries, source attribution, explicit trust labels, structured extraction, and verification before action.
- [[prompt-security/prompt-injection-test-cases]] - Minimal adversarial fixtures to test instruction override, tool misuse, hidden directives, and fake policy claims.

## Memory and Knowledge Integrity

- [[memory/memory-threat-model]] - Semantic memory poisoning, memory hallucination, retrieval noise, stale notes, and source confusion.
- [[memory/memory-citation-and-provenance]] - Memory citation format, source ranges, rollout IDs, and why provenance matters for future reuse.
- [[memory/session-isolation-and-memory-mode]] - Thread memory mode, ephemeral sessions, fork/resume behavior, and cross-session contamination boundaries.
- [[memory/compaction-as-information-loss]] - Compaction as lossy compression: what can be summarized, what needs exact evidence, and what should never be inferred.
- [[memory/knowledge-graph-as-memory-layer]] - How the code graph and derived wiki graph serve different memory roles for future agents.
- [[memory/memory-cleanup-and-snapshot-forensics]] - Reset, cleanup, snapshots, audit evidence, and incident response for corrupted memories.

## Tools, MCP, Plugins, and Connectors

- [[tools/mcp-connection-manager]] - Why MCP tool mutation should stay close to the connection manager and how tool surfaces are assembled.
- [[tools/tool-call-lifecycle]] - Tool discovery, tool call request, execution, output capture, error handling, and model feedback.
- [[tools/plugin-skill-loading]] - Plugin bundles, skills, MCP servers, app connectors, deferred tools, and installation trust.
- [[tools/connector-identity-and-permissions]] - User identity, agent identity, run/session identity, connector identity, and delegated tool access.
- [[tools/parameter-policy-and-abac]] - Attribute-based checks, parameter constraints, tool-call frequency limits, and resource scope.
- [[tools/mcp-protocol-risk]] - Protocol-level risks: tool list poisoning, tool call spoofing, response tampering, capability confusion, and audit gaps.
- [[tools/multi-agent-communication-risk]] - Subagent communication, handoff contamination, conflicting objectives, runaway fan-out, and consensus checks.

## OWASP Agent and LLM Threat Crosswalk

- [[owasp/t1-memory-poisoning]] - Memory poisoning mapped to Codex memory, compaction, local notes, graph artifacts, and rollback/resume behavior.
- [[owasp/t2-tool-misuse]] - Tool misuse mapped to shell commands, MCP calls, browser automation, file edits, and connector operations.
- [[owasp/t3-excessive-agency-and-unauthorized-call]] - Over-permission, unauthorized tool calls, hidden capability expansion, and approval bypass attempts.
- [[owasp/t4-resource-overload]] - Resource exhaustion through long builds, recursive scans, large graphs, subagent fan-out, and dashboard/server loops.
- [[owasp/t5-cascading-hallucination]] - How wrong intermediate summaries can propagate through compaction, memory, subagents, and wiki graph generation.
- [[owasp/t6-goal-and-intent-manipulation]] - Attacks that steer the agent away from the user's actual objective or redefine success criteria.
- [[owasp/t7-inconsistency-and-deceptive-behavior]] - Conflicting state, unverifiable claims, silent failure, and misleading completion reports.
- [[owasp/t8-repudiation-and-nontraceability]] - Missing audit links between user request, tool call, approval, file change, test evidence, and final answer.
- [[owasp/t9-identity-spoofing]] - User, agent, connector, MCP server, and subagent identity confusion.
- [[owasp/t10-human-oversight-overload]] - Approval fatigue, noisy warnings, unclear risk copy, and review UX that pushes users toward unsafe acceptance.
- [[owasp/t11-remote-code-execution]] - Shell execution, dependency install scripts, build scripts, generated code, and sandbox escape assumptions.
- [[owasp/t12-agent-communication-poisoning]] - Poisoned subagent outputs, forged summaries, and cross-agent message provenance.
- [[owasp/t13-rogue-agent]] - Misbehaving subagent or external agent with divergent goal, stale context, or excessive permissions.
- [[owasp/t14-human-attack-on-multi-agent-system]] - Social manipulation of agent teams, injected review comments, and adversarial steering.
- [[owasp/t15-human-manipulation]] - Human-origin malicious instructions, coercive approvals, and insider-style misuse of agent authority.

## TC260-TR-005-2026 Risk Crosswalk

- [[tc260/aia01-agent-hijack]] - Prompt injection, jailbreak, multi-turn manipulation, and boundary-breaking behavior.
- [[tc260/aia02-data-leakage-tampering-poisoning]] - Sensitive data flow, logs, training/retrieval data, local artifacts, and dynamic access control.
- [[tc260/aia03-supply-chain-plugin-poisoning]] - Third-party components, plugins, model/tool artifacts, dependency scripts, and sandboxed execution.
- [[tc260/aia04-identity-spoofing-unauthorized-access]] - Over-authorization, token misuse, role change monitoring, and cross-agent permission isolation.
- [[tc260/aia05-hallucination-and-strategic-refusal]] - Planning verification, decision boundary management, high-risk human confirmation, and explainable decisions.
- [[tc260/aia06-multi-agent-cascade-deadlock-overload]] - Cascade hallucination, conflicting goals, resource quotas, load monitoring, intervention, and consensus checks.
- [[tc260/aia07-protocol-risk]] - Agent communication protocol flaws, integrity checks, protocol audit, and signature-style assurance.
- [[tc260/aia08-runtime-environment-risk]] - Container escape, sandbox bypass, side channels, script monitoring, and high-privilege code review.
- [[tc260/aia09-human-oversight-traceability-failure]] - Lifecycle logging, monitoring, audit, signed logs, and forensic reconstruction.
- [[tc260/aia10-memory-hallucination-and-manipulation]] - RAG/semantic memory drift, forged memory fragments, session isolation, cleanup, and snapshot evidence.
- [[tc260/aia11-tool-misuse]] - Fine-grained access control, tool monitoring, instruction filtering, action scope, frequency limits, and log retention.

## Evidence Sources and Raw Inputs

- [[source/understand-code-graph-summary]] - Compressed statistics from the existing Understand Anything code graph: node types, edge types, layers, tour steps, and high-value nodes.
- [[source/repository-docs-map]] - README, AGENTS, docs, app-server README, sandbox docs, exec policy docs, and config docs as source material.
- [[source/security-relevant-file-map]] - Source file map for guardian, approvals, sandboxing, shell escalation, process hardening, MCP, memory, compaction, and app-server APIs.
- [[source/test-evidence-map]] - Tests and fixtures that can prove claims about approvals, sandbox policies, protocol shape, memory citations, and compaction events.
- [[source/local-research-notes]] - Prior local notes, rollout summaries, and wiki raw materials that can seed deeper pages after provenance review.
- [[source/standards-taxonomy-input]] - User-provided OWASP Agent/LLM and TC260-TR-005-2026 threat taxonomy used for crosswalk pages.

## Human Review Questions

- [[questions/long-horizon-design-intent]] - Which long-horizon mechanisms are deliberate product design, and which are implementation side effects?
- [[questions/security-guarantee-boundaries]] - Which controls are enforceable security boundaries, and which are best-effort UX or model-facing guardrails?
- [[questions/risk-taxonomy-fit]] - Where OWASP and TC260 risks map cleanly onto Codex code, and where the mapping is only analogical.
- [[questions/agent-memory-policy]] - What should count as durable memory, temporary context, graph-derived knowledge, or raw evidence?
- [[questions/tool-and-plugin-trust]] - Which tool/plugin/connector paths should be treated as trusted code, untrusted input, or delegated authority?
- [[questions/wiki-granularity]] - Which pages should stay high-level, which modules deserve deep dives, and which low-level nodes should remain only in the source graph.
