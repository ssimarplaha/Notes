# Contributing

This repository packages the `notion-notes` skill and its deterministic renderer.

## Development Setup

Use Node 20 or newer:

```bash
nvm use
npm run bootstrap
```

Run the local gate before sharing a change:

```bash
npm run check
```

For documentation-only changes, at minimum run:

```bash
npm run typecheck
npm run privacy:scan
git diff --check
```

## Renderer Rules

- Keep `.agents/skills/notion-notes/SKILL.md` as the workflow source of truth.
- Keep the bundle together: `SKILL.md`, `agents/openai.yaml`, `assets/`, `src/`, `scripts/`, and `references/`.
- Keep structured JSON plus the deterministic renderer as the only documented generation path.
- Keep the TypeScript renderer source canonical and the committed JavaScript CLI fresh.
- Regenerate/check the committed JavaScript CLI when TypeScript renderer source changes:

```bash
npm run build:dist
npm run check:dist
```

## Docs Change Checklist

When changing public docs, keep these paths consistent:

- `README.md`
- `docs/README.md`
- `.agents/README.md`
- `.agents/skills/notion-notes/SKILL.md`
- `.agents/skills/notion-notes/references/`

The documented user journey should stay: prerequisites, bootstrap, Codex install, Claude install, render, validate, package, privacy scan, troubleshoot.

Do not duplicate contradictory command snippets. Prefer these public commands:

```bash
npm run install:codex
npm run install:claude
npm run render -- input.json Notes
npm run package:skill
npm run typecheck
npm run privacy:scan
```

## Privacy

Do not commit private Notion page URLs, private workspace links, credentials, or API keys in sample JSON, generated HTML, docs, or screenshots.

Run:

```bash
npm run privacy:scan
```

Keep `metadata.sourceUrl` blank for private Notion pages and public sample material. Public fact-check URLs belong in citation records and Sources.
