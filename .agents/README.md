# Shared Codex Assets

This folder contains the repo-local agent assets for the `notion-notes` workflow. The skill folder is the source of truth for both Codex and Claude Code installs.

## Included Skill

- `.agents/skills/notion-notes/` - Codex skill for turning rough Notion notes into compact, fact-checked HTML study notes with selection highlighting and an interactive test.

## Install Into Codex

From the repository root:

```bash
npm run install:codex
```

This writes `~/.codex/skills/notion-notes`. After installation, invoke it with `notion-notes` or `$notion-notes`.

For a custom target:

```bash
CODEX_SKILLS_DIR=/path/to/skills npm run install:codex
```

## Install Into Claude Code

```bash
npm run install:claude
```

This writes `~/.claude/skills/notion-notes`. See [Claude Code](../docs/claude.md).

## Render a Notes Page

From the repo root:

```bash
npm run bootstrap
npm run render -- Notes/2605_25_31/2605_25_31.json Notes
```

The renderer accepts structured JSON and writes a standalone HTML page. It runs through the stable JavaScript CLI in `.agents/skills/notion-notes/scripts/`, with TypeScript source in `.agents/skills/notion-notes/src/`. Directory/default mode writes a normalized pair under `Notes/<note_slug>/`, for example `Notes/lesson/lesson.json` and `Notes/lesson/lesson.html`.

Generated pages expect a sibling JSON with the same base name, for example `lesson.html` expects `lesson.json`; browsers still require one manual file permission before highlights can save back to that JSON.
For one-off previews, pass an explicit HTML output path such as `/tmp/notion-notes-preview.html`.

## Package For Sharing

```bash
npm run package:skill
```

The tarball is written under `dist/` and contains the full `notion-notes` bundle.

## Notes for Sharing

- Keep private Notion source-page links out of committed sample notes.
- Keep public fact-check citation links in the generated Sources section when they verify claims.
- Keep the full skill folder together; the template, TypeScript renderer source, and references are all required for repeatable output.
- Run `npm run privacy:scan` before publishing a branch, sample output, screenshot, or packaged skill archive.
