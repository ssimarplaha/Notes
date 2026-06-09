# Validation

Run these checks after changing the skill, renderer, template, docs commands, or generated sample note. Keep validation scoped to the change, then run the full gate before publishing a broader update.

Node 20+ and installed npm dependencies are required for the TypeScript renderer tests and the local quality gate. Use `npm run bootstrap` for first setup.

## Required For Skill Or Sample Changes

```bash
npm run typecheck
npm run render -- Notes/2605_25_31/2605_25_31.json Notes
```

Then preview `Notes/2605_25_31/2605_25_31.html`.

## Full Maintainer Gate

```bash
npm run check
```

This runs doctor checks, TypeScript type checking, ESLint, unit tests, browser tests, dist freshness, privacy scanning, sample regeneration, and `git diff --check`.

## Doctor

```bash
npm run doctor
```

This checks Node/npm availability, Node version, installed dependency binaries, required bundle files, renderer JavaScript syntax, package lock presence, and sample privacy.

## Syntax Check

```bash
npm run typecheck
```

## Regenerate Sample

```bash
npm run render -- Notes/2605_25_31/2605_25_31.json Notes
```

## Dist Freshness

```bash
npm run build:dist
npm run check:dist
```

Run these only after changing `.agents/skills/notion-notes/src/`.

## Privacy Scan

```bash
npm run privacy:scan
```

This scans docs, sample JSON/HTML, and skill files for private Notion URLs and common secret patterns.

## Explicit Preview

```bash
npm run render -- Notes/2605_25_31/2605_25_31.json /tmp/notion-notes-preview.html
```

## Manual Checks

Verify the generated preview has:

- sticky left index
- technical-blog reading layout
- selection-based Green / Yellow / Red toolbar
- collapsed right-side highlights review panel
- sibling JSON filename prompt
- filename-matched save-back, where `page.html` expects `page.json`
- per-question answer reveal buttons
- citation links in Sources only
- no visible private Notion source-page link

Renderer validation fails invalid production data before writing output files. Error paths are stable, for example `questions[3].answer`, `sections[1].citations[0]`, and `highlights[0].scopeId`.

## Docs Change Checklist

For documentation-only changes, verify commands stay consistent across `README.md`, `docs/`, `.agents/README.md`, and `.agents/skills/notion-notes/SKILL.md`:

- prerequisites: `nvm use`, `npm run bootstrap`
- install: `npm run install:codex`, `npm run install:claude`
- render: `npm run render -- input.json Notes`
- package: `npm run package:skill`
- privacy: `npm run privacy:scan`
- source changes only: `npm run build:dist`, `npm run check:dist`

## Git Whitespace Checks

```bash
git diff --check
git diff --cached --check
```
