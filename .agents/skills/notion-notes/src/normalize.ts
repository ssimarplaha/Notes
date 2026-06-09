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

import {matchingJsonFileName} from "./paths";

/** Options used to normalize output-specific metadata deterministically. */
export interface NormalizeOptions {
  outputPath: string;
  generatedAt?: string;
}

/** Adds renderer defaults while preserving untrusted shape for validation. */
export function normalizeInput(input: unknown, options: NormalizeOptions): unknown {
  const source: Record<string, unknown> = isRecord(input) ? input : {};
  const metadata: Record<string, unknown> = isRecord(source["metadata"]) ? source["metadata"] : {};
  const generatedAt = firstNonEmptyString([metadata["generatedAt"], options.generatedAt]) ||
    currentDateStamp();
  const title = firstNonEmptyString([metadata["title"], metadata["sourceTitle"]]) ||
    "Notion Notes";

  return {
    metadata: {
      title,
      sourceTitle: stringOrEmpty(metadata["sourceTitle"]),
      sourceUrl: stringOrEmpty(metadata["sourceUrl"]),
      factCheckMode: firstNonEmptyString([metadata["factCheckMode"]]) ||
        "cited verification",
      generatedAt,
      outputName: stringOrEmpty(metadata["outputName"]),
      htmlFileName: path.basename(options.outputPath),
      jsonFileName: matchingJsonFileName(options.outputPath)
    },
    summary: valueOrDefault(source, "summary", []),
    sections: valueOrDefault(source, "sections", []),
    quickReview: valueOrDefault(source, "quickReview", []),
    citations: valueOrDefault(source, "citations", []),
    questions: valueOrDefault(source, "questions", []),
    highlights: valueOrDefault(source, "highlights", [])
  };
}

function valueOrDefault(
  source: Record<string, unknown>,
  key: string,
  fallback: unknown
): unknown {
  return Object.prototype.hasOwnProperty.call(source, key) ? source[key] : fallback;
}

function stringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function firstNonEmptyString(values: readonly unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function currentDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
