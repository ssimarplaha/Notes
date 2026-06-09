# Renderer

The deterministic renderer CLI is:

```text
.agents/skills/notion-notes/scripts/render_notion_notes_page.js
```

It reads structured JSON, validates the content, injects the data into `assets/html-template/template.html`, and writes a standalone HTML page. The TypeScript source remains canonical in:

```text
.agents/skills/notion-notes/src/
```

The committed JavaScript runtime keeps the direct Node CLI stable for repo-local use, installed skills, and unpacked skill archives. Use this renderer path for generated samples and reusable notes; do not document or maintain a second ad hoc HTML generator.

## Directory Mode

Pass an input JSON file and an output directory:

```bash
npm run render -- input.json Notes
```

The renderer derives a slug and writes:

```text
Notes/<note_slug>/<note_slug>.json
Notes/<note_slug>/<note_slug>.html
```

If the output directory is omitted, `Notes` under the current working directory is used.

The generated HTML expects the generated JSON sibling with the same base filename for highlight save-back.

## Slug Derivation

The slug is a lowercase underscore slug chosen from the first available value:

1. `metadata.outputName`
2. `metadata.sourceTitle`
3. `metadata.title`
4. input filename

The renderer does not append an extra product suffix.

## Explicit HTML Preview Mode

Pass an HTML filename as the second argument to write a one-off preview file:

```bash
npm run render -- input.json /tmp/notion-notes-preview.html
```

In this mode, the renderer writes only the HTML file. The generated page still expects a JSON file with the same base name if highlight save-back is used.

## Installed Bundle Mode

After installing into Codex or Claude Code, the direct CLI can be run from the installed skill:

```bash
node ~/.codex/skills/notion-notes/scripts/render_notion_notes_page.js input.json Notes
node ~/.claude/skills/notion-notes/scripts/render_notion_notes_page.js input.json Notes
```

After unpacking a tarball from `npm run package:skill`, run the same CLI from the unpacked `notion-notes/scripts/` directory.

## Output Metadata

Directory mode normalizes `metadata.htmlFileName` and `metadata.jsonFileName` so the HTML can enforce sibling JSON matching. For example:

```json
{
  "htmlFileName": "2605_25_31.html",
  "jsonFileName": "2605_25_31.json"
}
```

## User Validation

Node 20+ is required. After `npm run bootstrap`, run:

```bash
npm run typecheck
npm run render -- Notes/2605_25_31/2605_25_31.json Notes
npm run privacy:scan
```

Then manually verify the sticky index, selection-based Green / Yellow / Red toolbar, collapsed highlights panel, sibling JSON prompt, per-question answer buttons, and public citation links.

## Maintainer Dist Freshness

Run these only after changing `.agents/skills/notion-notes/src/`:

```bash
npm run build:dist
npm run check:dist
```

`npm run check:dist` verifies that the committed JavaScript runtime has been refreshed after TypeScript renderer source changes.

For a full maintainer gate, run:

```bash
npm run check
```

This runs doctor checks, TypeScript type checking, ESLint, unit tests, browser tests, dist freshness, privacy scanning, sample regeneration, and `git diff --check`.
