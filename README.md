# Notion Notes Skill Package

This repository packages the `notion-notes` skill for turning rough Notion study or work pages into compact, fact-checked standalone HTML notes. It is meant to be cloned, installed into Codex or Claude Code, used locally to render notes, validated, and packaged for sharing without exposing private Notion data.

The deterministic renderer is part of the skill bundle. Keep `.agents/skills/notion-notes/` together and use the renderer instead of hand-writing one-off HTML when producing sample notes.

## What It Produces

Generated notes keep the current product shape:

- technical-blog reading layout
- sticky left sidebar as the main index
- selection-based Green / Yellow / Red text highlighting
- collapsed right-side highlights review panel
- sibling JSON save-back where `page.html` expects `page.json`
- public fact-check citations with full links in Sources
- no visible private Notion source-page link
- interactive end-of-chapter test with per-question answer reveal buttons

## Quick Start

Use Node 20 or newer from the repository root:

```bash
nvm use
npm run bootstrap
```

Render the minimal starter note:

```bash
npm run render -- examples/starter-note.json Notes
```

Render the included sample:

```bash
npm run render -- Notes/2605_25_31/2605_25_31.json Notes
```

Directory mode writes a normalized sibling pair:

```text
Notes/<note_slug>/<note_slug>.json
Notes/<note_slug>/<note_slug>.html
```

The HTML expects a JSON file with the same base filename for highlight save-back. For example, `page.html` expects `page.json`.

## Install Into Codex

```bash
npm run install:codex
```

This writes `~/.codex/skills/notion-notes`. Invoke the installed skill with `notion-notes` or `$notion-notes`.

## Install Into Claude Code

```bash
npm run install:claude
```

This writes `~/.claude/skills/notion-notes`. See [Claude Code](docs/claude.md).

## Validate Output

```bash
npm run typecheck
npm run render -- Notes/2605_25_31/2605_25_31.json Notes
npm run privacy:scan
```

Then preview `Notes/2605_25_31/2605_25_31.html` and verify the sticky index, selection highlight toolbar, right-side highlights panel, per-question answer buttons, sibling JSON behavior, and Sources links.

## Package And Share

```bash
npm run package:skill
```

The tarball is written under `dist/`. Run `npm run privacy:scan` before sharing the repository, generated samples, screenshots, or packaged skill archive.

## Direct Renderer CLI

The stable direct CLI is:

```bash
node .agents/skills/notion-notes/scripts/render_notion_notes_page.js input.json [output_dir|output.html]
```

Use `npm run render -- input.json Notes` for repo-local work. Use the direct CLI from an installed or unpacked skill bundle when testing outside this repository.

## Development

The renderer source lives in `.agents/skills/notion-notes/src/` as strict TypeScript modules. The committed JavaScript CLI lives at:

```text
.agents/skills/notion-notes/scripts/render_notion_notes_page.js
```

Run the full local gate before sharing renderer changes:

```bash
npm run check
```

If TypeScript renderer source changes, refresh and check the committed JavaScript runtime:

```bash
npm run build:dist
npm run check:dist
```

## Documentation

- [Docs index](docs/README.md)
- [Installation](docs/installation.md)
- [Claude Code](docs/claude.md)
- [Workflow](docs/workflow.md)
- [Input JSON](docs/input-json.md)
- [Builder](docs/builder.md)
- [Highlights](docs/highlights.md)
- [Validation](docs/validation.md)
- [Sample output](docs/sample-output.md)
- [Troubleshooting](docs/troubleshooting.md)

## Privacy

Do not commit private Notion page URLs in sample notes, generated HTML data, documentation, or preview assets. Keep public fact-check links in the generated Sources section when they verify claims.
