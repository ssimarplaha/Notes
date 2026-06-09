# Installation

The canonical skill bundle lives at:

```text
.agents/skills/notion-notes
```

Keep the full folder together when installing, copying, packaging, or publishing the skill.

## Prerequisites

Use Node 20 or newer with npm available:

```bash
nvm use
npm run bootstrap
```

`npm run bootstrap` installs dependencies and runs `npm run doctor`.

## Install Into Codex

Install the canonical bundle into a local Codex skills directory:

```bash
npm run install:codex
```

This writes:

```text
~/.codex/skills/notion-notes
```

After installation, invoke the workflow with `notion-notes` or `$notion-notes`.

To test a non-default Codex skills root:

```bash
CODEX_SKILLS_DIR=/tmp/codex-skills npm run install:codex
```

## Install Into Claude Code

Install the same bundle into Claude Code:

```bash
npm run install:claude
```

This writes:

```text
~/.claude/skills/notion-notes
```

See [Claude Code](claude.md).

To test a non-default Claude skills root:

```bash
CLAUDE_SKILLS_DIR=/tmp/claude-skills npm run install:claude
```

## Bundle Contents

Keep these paths together when sharing or installing the skill:

- `SKILL.md`
- `agents/openai.yaml`
- `assets/`
- `scripts/`
- `src/`
- `references/`

Do not install only `SKILL.md`; the renderer, template, references, and agent metadata are part of the reusable workflow.

## Repo-Local Use

You can also run the renderer directly from this repository without installing the skill:

```bash
npm run bootstrap
npm run render -- Notes/2605_25_31/2605_25_31.json Notes
```

Use repo-local paths when editing or validating the package. Use the installed copy only when testing how Codex or Claude Code discovers the skill outside this repository.

## Installed Or Unpacked Renderer

The direct CLI is stable inside installed skills and unpacked archives:

```bash
node ~/.codex/skills/notion-notes/scripts/render_notion_notes_page.js input.json Notes
node ~/.claude/skills/notion-notes/scripts/render_notion_notes_page.js input.json Notes
```

The same structured JSON schema and sibling output rules apply everywhere.

## Package The Skill

Create a tarball containing the canonical skill folder:

```bash
npm run package:skill
```

The archive is written under `dist/` by default and unpacks to `notion-notes/`.

Run the privacy scan before publishing or sending the tarball:

```bash
npm run privacy:scan
```
