# Troubleshooting

## `node` Or `npm` Is Missing

Install Node 20 or newer, then run:

```bash
nvm use
npm run bootstrap
```

`npm run doctor` reports the active Node version, npm availability, required bundle files, dependency binaries, renderer syntax, and privacy scan status.

## Install Script Wrote To The Wrong Place

Codex installs to `~/.codex/skills/notion-notes` by default. Claude Code installs to `~/.claude/skills/notion-notes` by default.

Use an override when testing:

```bash
CODEX_SKILLS_DIR=/tmp/codex-skills npm run install:codex
CLAUDE_SKILLS_DIR=/tmp/claude-skills npm run install:claude
```

The install scripts replace the target `notion-notes` folder with the canonical bundle from `.agents/skills/notion-notes/`.

## Browser Tests Cannot Find Chromium

Install the Playwright browser after `npm install`:

```bash
npx playwright install chromium
```

CI uses `npx playwright install --with-deps chromium`.

## Render Command Cannot Find The CLI

Use the npm script from the repository root:

```bash
npm run render -- input.json Notes
```

For installed or unpacked skill bundles, use the direct CLI inside that bundle:

```bash
node ~/.codex/skills/notion-notes/scripts/render_notion_notes_page.js input.json Notes
node ~/.claude/skills/notion-notes/scripts/render_notion_notes_page.js input.json Notes
```

## Generated JavaScript Is Stale

If TypeScript renderer source changed, refresh the committed JavaScript fingerprint:

```bash
npm run build:dist
npm run check:dist
```

## Highlights Do Not Save Back

The generated HTML must be next to a matching JSON file. For example:

```text
lesson.html
lesson.json
```

Use the page's `Connect matching JSON` button once so the browser can receive write permission. The page rejects the wrong filename.

If you rendered to an explicit HTML path such as `/tmp/notion-notes-preview.html`, put a matching `/tmp/notion-notes-preview.json` next to it before testing save-back.

## Private Notion Link Found

Clear `metadata.sourceUrl` for private Notion pages and keep citations limited to public fact-check links in Sources. Then run:

```bash
npm run privacy:scan
```

Do the same for generated HTML data, screenshots, docs, and tarballs before sharing.

## Package Looks Incomplete

The reusable package must include the full skill folder:

- `SKILL.md`
- `agents/openai.yaml`
- `assets/`
- `scripts/`
- `src/`
- `references/`

Regenerate the archive with:

```bash
npm run package:skill
```
