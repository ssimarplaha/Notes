# Repository Guidance

This repo packages the `notion-notes` Codex skill for sharing and reuse.

## Source of Truth

- Use `.agents/skills/notion-notes/SKILL.md` as the canonical workflow.
- Keep the full skill bundle together: `SKILL.md`, `agents/openai.yaml`, `assets/`, `scripts/`, `src/`, and `references/`.
- Do not replace the deterministic builder with ad hoc HTML generation unless the user explicitly asks for a redesign.

## Template Requirements

Generated notes must preserve the current product shape:

- technical-blog reading layout
- sticky left sidebar as the main index/navigation frame
- selection-based Green / Yellow / Red text highlighting
- collapsed right-side highlights review panel
- filename-matched JSON connection, where `page.html` expects `page.json` for highlight save-back
- fact-check citation links in Sources
- no visible source Notion page link in the hero or page metadata
- interactive end-of-chapter test with per-question answer reveal buttons

Do not commit private Notion page URLs in sample notes or generated HTML data.

## Validation

Run these checks after changing the skill or generated sample note:

```bash
npm run typecheck
npm run render -- Notes/2605_25_31/2605_25_31.json Notes
```

Then verify the preview has a sticky index, selection highlight code, per-question answer buttons, and citation links only in Sources.
