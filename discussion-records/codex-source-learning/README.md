# Codex Source Learning

## Current Module

- [第一课：长上下文、长程执行与可恢复性](lessons/0001-long-context-long-horizon-recovery.html)
- [速查：Sol Ultra 长程系统地图](reference/sol-ultra-long-horizon-map.html)
- [课程使命](MISSION.md)
- [高可信资源](RESOURCES.md)

第一课从系统边界入手。学习者完成课内测验并在对话中解释关键区分后，才会建立第一条相关 `learning-records/` 记录。

This directory is a local learning workspace for studying the Codex source code through source-backed discussions with an agent.

## Purpose

The workspace keeps discussion-driven learning separate from stable derived knowledge:

- `sessions/` records topic-specific discussion summaries and source walks.
- `learning-records/` records durable lessons learned from those sessions.
- `reference/` stores compact source maps, glossaries, and quick-reference material.
- `lessons/` stores short teaching artifacts when a topic is turned into a reusable lesson.
- `assets/` stores shared styles and interactive teaching components.
- `RESOURCES.md` lists trusted source entry points.
- `NOTES.md` stores local teaching preferences and operational notes.

Stable, reviewed knowledge can later be promoted into `derived-knowledge/wiki/`. Raw or evolving discussion material stays here until its source claims are checked.

## Boundary

This directory is for local study notes. It is not upstream product documentation and should not be treated as an authoritative Codex design spec unless a note links to exact source files, tests, or official docs.

## Suggested Flow

1. Start a question in `sessions/` with the date and topic.
2. Anchor every important claim to source files and line references.
3. Promote durable insights into `learning-records/`.
4. Move only reviewed, stable synthesis into `derived-knowledge/wiki/`.
