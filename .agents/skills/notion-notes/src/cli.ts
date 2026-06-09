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

import {formatError, UsageError, exitCodeForError, USAGE_EXIT_CODE} from "./errors";
import {renderPage} from "./renderer";

/** Parsed CLI arguments after usage validation. */
export interface CliArgs {
  inputPath: string;
  outputTarget?: string;
}

/** Returns the stable usage text printed for argument mistakes. */
export function usageText(): string {
  return [
    "Usage: npx tsx .agents/skills/notion-notes/src/render_notion_notes_page.ts input.json [output_dir|output.html]",
    "  Default output_dir is ./Notes, which writes ./Notes/<slug>/<slug>.json and .html."
  ].join("\n");
}

/** Parses process argv while preserving the documented two-argument CLI. */
export function parseCliArgs(argv: readonly string[]): CliArgs {
  const args = argv.slice(2);
  if (args.length < 1 || args.length > 2 || !args[0]) {
    throw new UsageError(usageText());
  }
  const parsed: CliArgs = {
    inputPath: path.resolve(args[0])
  };
  if (args[1]) {
    parsed.outputTarget = path.resolve(args[1]);
  }
  return parsed;
}

/** Runs the renderer CLI and returns a stable exit code. */
export function runCli(argv: readonly string[] = process.argv): number {
  try {
    const args = parseCliArgs(argv);
    const result = renderPage(args.inputPath, args.outputTarget);
    console.log(JSON.stringify(result, null, 2));
    return 0;
  } catch (error) {
    console.error(formatError(error));
    return exitCodeForError(error);
  }
}

/** Entry point used by the generated executable script. */
export function main(): void {
  const exitCode = runCli(process.argv);
  if (exitCode !== 0) {
    process.exitCode = exitCode || USAGE_EXIT_CODE;
  }
}
