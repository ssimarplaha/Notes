# Highlights

Generated pages support selection-based highlighting for article text. Highlight data is stored in the same structured JSON that generated the page.

## Selection Toolbar

Selecting text inside the note body opens a small toolbar with:

- Green
- Yellow
- Red
- Clear

The toolbar is positioned near the selection, clamps inside the viewport, and does not require note cards or click-to-mark behavior.

## Sibling JSON Matching

A page expects a JSON file with the same base name:

```text
page.html -> page.json
```

The expected filename comes from normalized metadata or the current HTML filename. If a user selects the wrong JSON file, the page rejects it.

Directory mode writes this pair automatically:

```text
Notes/<note_slug>/<note_slug>.html
Notes/<note_slug>/<note_slug>.json
```

## Browser Permission Flow

Highlight edits can be saved back into the JSON only after the browser receives file permission through the file picker. Until then, highlights can exist as a browser draft. Once the matching JSON is connected, add, clear, and color-change actions auto-save into the top-level `highlights` array.

The product intentionally keeps this flow small: connect the matching JSON once, then save-back is automatic. Do not add backup, import, export, or last-saved controls unless a user explicitly asks for that redesign.

## Review Panel

The right-side `Highlights` tab is collapsed by default. Opening it shows saved highlights grouped by color:

- Green
- Yellow
- Red

Each review item shows the highlighted text and source section. Clicking an item jumps back to the original marked text.

Manual preview checks should confirm that stored highlights restore on reload, panel contents update after add/clear/color changes, and the mobile panel avoids horizontal overflow.
