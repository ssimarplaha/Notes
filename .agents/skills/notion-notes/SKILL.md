---
name: notion-notes
description: Turn rough Notion study/work notes into compact, fact-checked, well-organized standalone HTML notes with examples, highlight tools, and an interactive test. Use when the user says notion-notes, $notion-notes, asks to organize a Notion page into high-value notes, or wants a Notion note transformed into a reusable study page with a test.
---

# Notion Notes

Create a standalone HTML study page from rough Notion notes. Preserve the user's intent, correct inaccurate claims, remove filler, add practical examples, and finish with an interactive test that reinforces the material over repeated attempts.

The default output should feel like a polished technical blog article with an end-of-chapter exercise section: readable prose, clean boxed examples, a sticky index sidebar, selection-based highlighting, a right-side highlights review panel, and restrained test feedback.

## Quick Workflow

1. Locate the Notion page with Notion search/fetch tools. If tools are unavailable, ask the user to connect Notion or paste/export the page.
2. Extract raw topics, definitions, claims, commands, examples, weak areas, and open questions from the page.
3. Read only the needed references:
   - `references/note-quality-rubric.md` before drafting the organized notes.
   - `references/fact-checking.md` before verifying claims or adding citations.
   - `references/question-design.md` before building the test.
4. Verify factual claims online when possible. Prefer official docs, standards, primary sources, and authoritative technical docs. Flag unverifiable claims instead of presenting them as true.
5. Produce structured JSON first, then run the deterministic renderer to create the standalone HTML page. Do not hand-write one-off HTML unless the user explicitly asks for a redesign.
6. Validate the generated page: unique question IDs, valid answers, non-empty sections, polished blog-style rendering, working selection highlights, working test controls, and clean rendering on mobile and desktop.

## Note Structure

Always organize the HTML page in this order:

- Index
- Executive summary
- Key concepts
- Corrected and fact-checked explanations
- Practical examples
- Commands or code snippets when useful
- Common mistakes
- Quick review
- Interactive test
- Sources

Keep the writing compact. Add detail only where it improves correctness, future recall, or practical use.

## Template Defaults

Use these presentation and interaction defaults for every generated page:

- Keep the sticky left sidebar as the main index/navigation frame.
- The sidebar should start with `Index`; do not render a `Notion Notes` brand label above it.
- Keep `metadata.sourceUrl` accepted for compatibility, but leave it blank for private Notion pages and public samples. Do not render an "Original Notion page" link in the hero or page metadata. Public citation links belong in Sources.
- Render note content as technical-blog reading material, not clickable note cards.
- Use clean full boxes for executive summaries, examples, snippets, and callouts. Do not use decorative left color bars for reading content.
- Highlighting is selection-based: selecting article text shows a small Green / Yellow / Red / Clear toolbar.
- The highlight toolbar should appear near the selected text with comfortable spacing from the selection and cursor, clamp inside the viewport, and keep a browser draft only until the notes JSON is connected.
- Include a collapsed right-edge `Highlights` tab that opens a side panel of saved highlights.
- The `Highlights` panel should group saved highlights by Green, Yellow, and Red, show the highlighted text plus source section, and let the user click an item to jump back to the original marked text.
- The panel must update when highlights are added, cleared, restored, or clipped. Use a clear empty state when no highlights exist.
- Highlights must persist in the source JSON through a top-level `highlights` array.
- Generated HTML should expect the matching sibling JSON by filename, for example `lesson.html` expects `lesson.json`.
- If JSON write permission is not ready, show a minimal matching-JSON prompt in the `Highlights` panel. After the user selects the expected notes JSON once, add/remove/color-change highlight edits should auto-save back into that JSON file; wrong JSON filenames should be rejected.
- Do not add backup/import/export/last-saved controls unless the user explicitly asks for them.
- Test questions must include per-question `Show Answer` / `Hide Answer` controls that reveal answers without scoring or changing user input.
- Correct, wrong, and review test results should change the whole question border color, not use a left-only result bar.

## HTML Renderer

Use the deterministic renderer:

```bash
npm run render -- input.json [output_dir]
```

The direct Node CLI is stable for installed or unpacked skill bundles:

```bash
node .agents/skills/notion-notes/scripts/render_notion_notes_page.js input.json [output_dir|output.html]
```

When `output_dir` is omitted, the renderer writes into `Notes/`. Directory/default mode writes a normalized sibling pair:

```text
Notes/<note_slug>/<note_slug>.json
Notes/<note_slug>/<note_slug>.html
```

For preview or backward-compatible explicit output, pass an HTML filename:

```bash
npm run render -- input.json /tmp/notion-notes-preview.html
```

The input JSON must include:

```json
{
  "metadata": {
    "title": "Study page title",
    "outputName": "optional_slug_override",
    "sourceTitle": "Original Notion page title",
    "sourceUrl": "",
    "factCheckMode": "cited verification"
  },
  "summary": ["Compact executive summary item"],
  "sections": [
    {
      "id": "concept-id",
      "title": "Concept title",
      "items": ["High-value explanation"],
      "examples": [{"title": "Example", "body": "Practical example"}],
      "mistakes": ["Common mistake"],
      "citations": ["src-1"]
    }
  ],
  "quickReview": ["Fast recall item"],
  "citations": [{"id": "src-1", "label": "Official docs", "url": "https://example.com", "note": "What this source verifies"}],
  "questions": [],
  "highlights": []
}
```

Keep private Notion URLs out of `metadata.sourceUrl`, citation URLs, generated HTML data, and sample files. Use public citation records for fact-checked claims.

Question records follow the `test_template_1` style:

```json
{
  "id": "mcq-concept-q1",
  "testType": "mcq",
  "sectionId": "concept-id",
  "source": "Concept title",
  "question": "Question text",
  "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
  "answer": "A"
}
```

Supported `testType` values are `tf`, `mcq`, `completion`, and `written`.

## Quality Bar

- Index links must work and reflect all major sections.
- The sidebar must begin with `Index` and must not show `Notion Notes` above it.
- Reading content must use clean boxed treatments, not decorative left bars or clickable note-card marks.
- Selection highlight controls must support green, yellow, red, clear, comfortable toolbar spacing, viewport clamping, browser draft fallback, and JSON auto-save after connection.
- The right-side `Highlights` panel must be collapsed by default, group highlights by color, update live, restore from stored highlights, support item click-to-jump, and avoid mobile horizontal overflow.
- Generated pages must preserve and restore top-level JSON `highlights` records, and older JSON files without `highlights` must still build.
- The test must support shuffle, answer checking, reveal answers, stats, weak-topic review, and wrong-question print/export.
- Each question must have its own answer reveal button, and reveal must not count as checking the question.
- Test result states must use full-border color changes for correct, wrong, and review.
- Each factual correction must be cited or marked as needing verification.
- Citation URLs must be public fact-check links; private Notion source links must not be committed.
- Each question must map to a section/topic and have a valid answer.
- The generated HTML must be standalone and use no external runtime dependency.

## Default Output

If the user does not provide an explicit HTML filename, write:

- `Notes/<note_slug>/<note_slug>.json` for repeatable structured source data.
- `Notes/<note_slug>/<note_slug>.html` for the standalone notes and test page.

Derive `<note_slug>` as a lowercase underscore slug from `metadata.outputName`, then `metadata.sourceTitle`, then `metadata.title`, then the input filename. Do not append an extra product suffix to generated note filenames.
