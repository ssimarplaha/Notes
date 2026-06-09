# Claude Code

Claude Code uses the same canonical skill bundle as Codex. There is no separate Claude copy in this repository.

## Install

From the repository root:

```bash
npm run bootstrap
npm run install:claude
```

This writes:

```text
~/.claude/skills/notion-notes
```

To install somewhere else:

```bash
CLAUDE_SKILLS_DIR=/path/to/skills npm run install:claude
```

## Use

Ask Claude Code to use `notion-notes` for rough Notion notes, pasted exports, or structured JSON that should become a compact HTML study page with citations, selection highlights, saved-highlight review, and an end test.

The workflow remains skill first:

1. Organize the source material into structured JSON.
2. Keep `metadata.sourceUrl` blank for private Notion pages.
3. Use public citation records for fact-checked claims.
4. Render through the deterministic JavaScript CLI.
5. Validate the HTML and run the privacy scan before sharing.

## Renderer

The installed bundle includes the stable JavaScript renderer:

```bash
node ~/.claude/skills/notion-notes/scripts/render_notion_notes_page.js input.json Notes
```

The same JSON schema and output rules apply for Codex and Claude Code.

## Validate

From the repository checkout that produced the installed skill:

```bash
npm run typecheck
npm run render -- Notes/2605_25_31/2605_25_31.json Notes
npm run privacy:scan
```

Preview the generated sample and verify sticky index navigation, selection-based Green / Yellow / Red highlights, the collapsed highlights panel, per-question answer buttons, and public citation links in Sources.
