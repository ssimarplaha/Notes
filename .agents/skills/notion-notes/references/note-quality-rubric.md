# Note Quality Rubric

Use this rubric before drafting or revising notes.

## Target

Create notes that save reader time. The page should be compact enough to scan, detailed enough to trust, and structured enough to revisit months later.

## Required Shape

- Start with a short executive summary that tells the reader what matters and why.
- Group raw note fragments into durable concepts, not the order they appeared in the source page.
- Use concise headings that name the idea directly.
- Keep one idea per bullet.
- Prefer tables for comparisons and checklists for repeatable procedures.
- Add examples only when they clarify real usage or a common failure.
- Keep commands and code snippets copyable.
- End each major topic with what the reader should remember or do.

## Presentation Rules

- The page should read like a polished technical blog article, not a stack of clickable note cards.
- Preserve the sticky sidebar index, but the first visible sidebar label should be `Index`; do not add a `Notion Notes` brand label above it.
- Use clean boxed treatments for executive summaries, examples, snippets, and callouts.
- Do not use decorative vertical left bars for summary, example, snippet, or callout boxes.
- Keep boxes restrained: subtle full borders, light backgrounds, balanced padding, and consistent radius.
- Keep code blocks visually distinct inside snippet boxes, but avoid heavy decoration.
- Use selection-based highlighting only; do not ask the reader to click whole note cards to mark them.
- The selection highlighter toolbar should appear with comfortable spacing from the selected text and cursor, stay inside the viewport, and support Green / Yellow / Red / Clear.
- Add a collapsed right-edge `Highlights` panel as the standard way to review saved highlights without scanning the full document.
- The panel should group saved highlights by Green, Yellow, and Red, show each highlight's source section, and let users click an item to jump back to the original marked text.
- The highlights panel should have a clean empty state and mobile slide-over behavior with no horizontal overflow.
- Saved highlights should persist in the notes JSON through a top-level `highlights` array.
- Generated HTML should expect a matching sibling JSON by filename, for example `lesson.html` expects `lesson.json`.
- If JSON write permission is not ready, show only a minimal `Connect JSON` prompt; after connection, highlight add/remove/color changes should auto-save into that JSON file.
- Do not add backup/import/export/last-saved controls unless the user explicitly asks for them.

## Editing Rules

- Preserve the user's intent and rough-note discoveries.
- Correct spelling, grammar, and terminology silently unless the correction changes meaning.
- Remove filler, motivational wording, duplicated bullets, and vague claims.
- Convert half-formed notes into complete, accurate statements.
- Separate facts from interpretation.
- Mark open questions as open questions.
- Keep private Notion page URLs out of public sample JSON, generated HTML data, and citation records.
- Keep definitions operational: explain what the thing is, where it is used, and what mistake it prevents.

## Compactness Standard

Every paragraph or bullet must pass at least one test:

- It explains a concept needed to understand the topic.
- It corrects or verifies a rough note.
- It gives an example, command, or workflow the reader can reuse.
- It warns about a realistic mistake.
- It prepares the reader for a test question.

Delete anything that does not pass.
