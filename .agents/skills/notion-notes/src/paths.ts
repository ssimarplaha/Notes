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

import type {RenderPlan} from "./schema";

const HTML_EXTENSION_PATTERN = /\.html?$/i;

/** Returns true when a CLI output target is an explicit HTML preview path. */
export function isHtmlOutputTarget(value: string | undefined): boolean {
  return HTML_EXTENSION_PATTERN.test(String(value || ""));
}

/** Returns the sibling JSON filename expected by an HTML output file. */
export function matchingJsonFileName(outputPath: string): string {
  const extension = path.extname(outputPath || "");
  const baseName = path.basename(outputPath || "notion-notes.html", extension);
  return `${baseName || "notion-notes"}.json`;
}

/** Converts user-facing titles and output names into safe underscore slugs. */
export function slugifyOutputName(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  const normalized = raw
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "notes";
}

/** Selects the deterministic output slug using the documented precedence. */
export function outputSlugForInput(input: unknown, inputPath: string): string {
  const metadata: Record<string, unknown> = isRecord(input) && isRecord(input["metadata"]) ?
    input["metadata"] :
    {};
  const fallbackName = path.basename(inputPath, path.extname(inputPath));
  return slugifyOutputName(
    firstNonEmptyString([
      metadata["outputName"],
      metadata["sourceTitle"],
      metadata["title"],
      fallbackName
    ])
  );
}

/** Resolves directory mode or explicit HTML preview mode without writing. */
export function resolveRenderPlan(
  inputPath: string,
  outputTarget: string | undefined,
  input: unknown
): RenderPlan {
  if (outputTarget && isHtmlOutputTarget(outputTarget)) {
    const outputPath = path.resolve(outputTarget);
    return {
      mode: "explicit",
      outputPath,
      jsonPath: null,
      outputDir: path.dirname(outputPath),
      slug: slugifyOutputName(path.basename(outputPath, path.extname(outputPath)))
    };
  }

  const outputRoot = outputTarget ?
    path.resolve(outputTarget) :
    path.resolve(process.cwd(), "Notes");
  const slug = outputSlugForInput(input, inputPath);
  const outputDir = path.join(outputRoot, slug);
  return {
    mode: "directory",
    outputPath: path.join(outputDir, `${slug}.html`),
    jsonPath: path.join(outputDir, `${slug}.json`),
    outputDir,
    slug
  };
}

function firstNonEmptyString(values: readonly unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
