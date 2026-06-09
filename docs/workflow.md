# Workflow

The `notion-notes` workflow turns rough Notion content into a reusable study page with citations and a test.

Use `.agents/skills/notion-notes/SKILL.md` as the canonical agent workflow. Do not replace the deterministic renderer with ad hoc HTML generation for public samples or reusable notes.

## 1. Fetch The Notion Source

Use Notion tools to locate and fetch the source page. If Notion is unavailable, ask for pasted content or an export. Extract only useful material: topics, definitions, claims, commands, examples, unclear points, and likely test targets.

Do not commit private Notion page URLs. `metadata.sourceUrl` remains accepted for compatibility, but generated pages must not show a source Notion link in the hero or page metadata.

## 2. Fact-Check

Verify factual claims before presenting them as true. Prefer official docs, standards, primary sources, and authoritative technical references. Add public citation records for claims that need support, and mark anything uncertain instead of filling gaps with guesses.

Citation URLs should be public fact-check sources. Private Notion links, workspace URLs, credentials, or unpublished documents do not belong in sample JSON or generated HTML.

## 3. Draft Structured JSON

Write the note content as structured JSON for the deterministic renderer. Keep sections compact but complete enough to stand alone. Include summary points, sections, examples, mistakes, quick review items, citations, questions, and a top-level `highlights` array.

Keep `metadata.sourceUrl` blank for private Notion pages. Use `metadata.outputName` when the public filename should be stable.

## 4. Render HTML

Run the deterministic renderer:

```bash
npm run render -- input.json Notes
```

The default output is:

```text
Notes/<note_slug>/<note_slug>.json
Notes/<note_slug>/<note_slug>.html
```

The HTML expects the JSON sibling with the same base filename before highlight save-back can persist edits.

## 5. Validate

For ordinary public-note or docs validation, run:

```bash
npm run typecheck
npm run render -- Notes/2605_25_31/2605_25_31.json Notes
npm run privacy:scan
```

Then manually verify the rendered behavior:

- sticky left index
- selection-based Green / Yellow / Red highlighting
- collapsed right-side highlights review panel
- sibling JSON prompt and filename check
- per-question answer reveal buttons
- citation links in Sources only
- no visible private Notion source-page link

Use `examples/starter-note.json` as a minimal starting point for new pages.

Run `npm run build:dist` and `npm run check:dist` only after changing `.agents/skills/notion-notes/src/`.
