# Documentation

This folder documents the public `notion-notes` skill package, its deterministic HTML renderer, and the sample output included in this repository. Start here when cloning the repo for outside reuse.

## First Run Path

```bash
nvm use
npm run bootstrap
npm run install:codex
npm run install:claude
npm run render -- examples/starter-note.json Notes
npm run typecheck
npm run privacy:scan
```

Use only the install command for the agent you actually need. `npm run install:codex` writes `~/.codex/skills/notion-notes`; `npm run install:claude` writes `~/.claude/skills/notion-notes`.

## Guides

- [Installation](installation.md) - prerequisites, bootstrap, Codex install, Claude install, custom install roots, and tarball packaging.
- [Workflow](workflow.md) - move from Notion or pasted notes to fact-checking, structured JSON, deterministic rendering, and validation.
- [Input JSON](input-json.md) - required schema shape, private-safe metadata, citations, questions, and saved highlights.
- [Renderer](builder.md) - CLI modes, slug derivation, output layout, installed-bundle use, and dist freshness.
- [Highlights](highlights.md) - selection toolbar, filename-matched JSON save-back, browser permission, and review panel behavior.
- [Validation](validation.md) - command checks and manual preview checks after docs, sample, skill, template, or renderer changes.
- [Claude Code](claude.md) - use the same canonical skill bundle with Claude Code.
- [Sample output](sample-output.md) - what the included `2605_25_31` sample demonstrates.
- [Troubleshooting](troubleshooting.md) - setup, install, renderer, privacy, and highlight save-back fixes.

## Product Shape

Generated pages should keep:

- technical-blog reading layout
- sticky left sidebar as the main index
- selection-based Green / Yellow / Red highlighting
- collapsed right-side highlights review panel
- sibling JSON matching, where `page.html` expects `page.json`
- public fact-check citation links in Sources
- no visible private Notion source-page link
- interactive end-of-chapter test with per-question answer reveal buttons

## Starter JSON

Use `examples/starter-note.json` as the smallest practical input file:

```bash
npm run render -- examples/starter-note.json Notes
```

## Sharing Checklist

Before sharing a branch, sample output, screenshot, or packaged skill archive:

```bash
npm run render -- Notes/2605_25_31/2605_25_31.json Notes
npm run privacy:scan
npm run package:skill
```

Run `npm run build:dist` followed by `npm run check:dist` only after changing `.agents/skills/notion-notes/src/`.
