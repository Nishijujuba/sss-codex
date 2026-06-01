# Derived Knowledge Checkpoint Status

Updated: 2026-06-01

## Checkpoint

This checkpoint is the first usable v0 of the derived Codex knowledge wiki. It is built from the existing Understand Anything code graph, repository docs, and targeted source evidence for long-horizon agent work and agent security.

## New Content

- `index.md`: wiki construction index with 11 topic sections and 94 planned wikilinks.
- `raw/understand-graph-summary.json`: compressed summary of the existing code graph.
- `raw/source-file-map.json`: source evidence map for orientation, architecture, long-horizon work, memory, security, prompt-security, tools/MCP, and OWASP/TC260 mapping.
- `wiki/`: 28 first-pass article pages covering repository orientation, architecture, long-horizon agent design, memory integrity, security controls, prompt injection, and selected OWASP/TC260 risks.
- `.understand-anything/`: generated graph artifacts are included in git tracking for this checkpoint by user request.
- `derived-knowledge/.understand-anything/intermediate/scan-manifest.json`: parser scan manifest is included so the checkpoint records the exact `understand-knowledge` detection result.

## Verification Status

- Raw JSON parse check: passed.
- Wiki page structure check: passed for 28 markdown pages.
- Required page fields: `title`, `type`, `created`, `updated`, `tags`, `sources`.
- Required page sections: `定义`, `为什么重要`, `代码仓证据`, `待验证问题`, `Related`.
- Related wikilinks: at least 3 per generated page.
- Placeholder scan: no unfinished-task markers, triple-question placeholders, or common mojibake markers found in `derived-knowledge/`.
- `understand-knowledge` parser detection: passed.

## Parser Snapshot

- Articles: 28
- Sources: 2
- Topics: 11
- Wikilinks: 147
- Unresolved wikilinks: 66

The unresolved wikilinks are expected for this checkpoint because `index.md` intentionally plans 94 pages and this v0 implements the first high-value subset.

## Known Gaps

- OWASP and TC260 crosswalk pages need official-source calibration before they should be treated as standards-complete.
- Some security guarantees remain marked as `待验证` where local source code exposes the request path, policy template, or event shape but not the full remote scoring behavior.
- Platform-specific sandbox behavior needs separate verification on macOS, Linux, and Windows.
- The remaining planned pages in `index.md` still need follow-up generation.
- `derived-knowledge/.understand-anything/intermediate/` is an intermediate parser output. It is tracked in this checkpoint because the user requested the generated `.understand-anything` directories in the PR.
