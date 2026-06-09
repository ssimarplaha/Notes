/**
 * @license MIT
 */

/**
 * @fileoverview Renders structured Notion notes JSON into a standalone HTML
 * study page and, in directory mode, writes the normalized sibling JSON file.
 *
 * High-level flow:
 * 1. Parse CLI input and resolve output mode.
 * 2. Read source JSON as unknown input.
 * 3. Normalize and validate the notes schema.
 * 4. Validate the HTML template contract.
 * 5. Embed escaped JSON into the standalone template.
 * 6. Atomically write HTML and optional sibling JSON.
 */

import * as path from "node:path";

import {main} from "./cli";
import {build, renderPage} from "./renderer";
import {validateTemplate} from "./template";
import {validateData} from "./validate";

export {build, renderPage, validateData, validateTemplate};

if (isCliEntrypoint(process.argv)) {
  main();
}

/** Detects direct TS execution without triggering during test imports. */
function isCliEntrypoint(argv: readonly string[]): boolean {
  const entrypoint = argv[1] ? path.basename(argv[1]) : "";
  return entrypoint === "render_notion_notes_page.ts";
}
