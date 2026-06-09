# Input JSON

The renderer accepts one structured JSON object with metadata, note content, citations, test questions, and optional saved highlights. This JSON is the generation source; do not bypass it with hand-written HTML for reusable notes or public samples.

## Minimal Shape

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
      "commands": [{"title": "Command", "body": "When to use it", "code": "example --flag"}],
      "mistakes": ["Common mistake"],
      "citations": ["src-1"]
    }
  ],
  "quickReview": ["Fast recall item"],
  "citations": [
    {
      "id": "src-1",
      "label": "Official docs",
      "url": "https://example.com",
      "note": "What this source verifies"
    }
  ],
  "questions": [],
  "highlights": []
}
```

See `examples/starter-note.json` for a minimal renderable starter file.

## Metadata

- `title` is required after normalization and becomes the HTML title and hero heading.
- `outputName` is optional and takes priority for slug derivation in directory mode.
- `sourceTitle` is optional and can be used as a slug fallback.
- `sourceUrl` is accepted for compatibility but should be blank for private Notion pages and public samples.
- `factCheckMode` describes how claims were verified.
- `htmlFileName` and `jsonFileName` are written by the builder during directory output.

Generated pages must not render a visible private Notion source-page link in the hero or page metadata. Public citation URLs belong in citation records, not `metadata.sourceUrl`.

## Sections

Each section needs a lowercase kebab-case `id`, a `title`, and at least one item. Optional arrays include:

- `examples`
- `commands`
- `mistakes`
- `citations`

Section citation IDs must exist in the top-level `citations` array.

## Citations

Top-level `citations` records should point to public sources that verify factual claims:

```json
{
  "id": "src-official-docs",
  "label": "Official docs",
  "url": "https://example.com/docs",
  "note": "Verifies the command behavior used in the section."
}
```

Use section `citations` arrays to reference these IDs. Do not store private Notion page URLs, workspace exports, credentials, or unpublished documents as citation URLs.

## Questions

Supported `testType` values are:

- `tf`
- `mcq`
- `completion`
- `written`

Question IDs must be unique. `sectionId`, when present, must match a section ID.

MCQ questions need an `options` object and an `answer` key that exists in that object. Completion questions need `answerText` or `acceptedAnswers`. Written questions need `modelAnswerText`.

Every production question should include `sectionId` and `source` so stats and weak-topic review can map the result back to the note. The page renders per-question answer reveal buttons, so answers must be complete enough to be useful when shown without scoring.

## Highlights

`highlights` is optional and should be an array. The generated HTML also writes highlight edits back into this array when the browser has permission to update the matching sibling JSON file.

Supported highlight colors are `green`, `yellow`, and `red`. Stored highlights may reference `summary`, `quick-review`, or a valid section ID.

Directory/default rendering writes normalized `htmlFileName` and `jsonFileName` metadata so `page.html` can enforce `page.json` matching for save-back.
