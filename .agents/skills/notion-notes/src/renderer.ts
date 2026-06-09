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

import * as fs from "node:fs";
import * as path from "node:path";

import {atomicWriteUtf8, ensureDirectory, readJsonUnknown, readUtf8} from "./fs_io";
import {normalizeInput} from "./normalize";
import {resolveRenderPlan} from "./paths";
import type {RenderOptions, RenderResult} from "./schema";
import {renderTemplate, validateTemplate} from "./template";
import {validateData} from "./validate";

const TEMPLATE_RELATIVE_PATH = path.join("assets", "html-template", "template.html");

/** Renders a notes JSON file into HTML and optional normalized sibling JSON. */
export function renderPage(
  inputPath: string,
  outputTarget?: string,
  options: RenderOptions = {}
): RenderResult {
  const resolvedInputPath = path.resolve(inputPath);
  const sourceData = readJsonUnknown(resolvedInputPath);
  const renderPlan = resolveRenderPlan(resolvedInputPath, outputTarget, sourceData);
  const normalizeOptions = options.generatedAt === undefined ?
    {outputPath: renderPlan.outputPath} :
    {outputPath: renderPlan.outputPath, generatedAt: options.generatedAt};
  const normalizedUnknown = normalizeInput(sourceData, normalizeOptions);
  const data = validateData(normalizedUnknown);
  const template = readUtf8(options.templatePath || resolveDefaultTemplatePath());
  validateTemplate(template);
  const html = renderTemplate(template, data);

  ensureDirectory(renderPlan.outputDir);
  if (renderPlan.jsonPath) {
    atomicWriteUtf8(renderPlan.jsonPath, `${JSON.stringify(data, null, 2)}\n`);
  }
  atomicWriteUtf8(renderPlan.outputPath, html);

  return {
    mode: renderPlan.mode,
    slug: renderPlan.slug,
    outputPath: renderPlan.outputPath,
    jsonPath: renderPlan.jsonPath,
    sections: data.sections.length,
    citations: data.citations.length,
    questions: data.questions.length,
    highlights: data.highlights.length,
    jsonFileName: data.metadata.jsonFileName
  };
}

/** Backward-compatible programmatic alias for older callers. */
export const build = renderPage;

function resolveDefaultTemplatePath(): string {
  const candidates = defaultTemplatePathCandidates();
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0] || path.join("assets", "html-template", "template.html");
}

function defaultTemplatePathCandidates(): string[] {
  const candidates: string[] = [];

  if (typeof __filename === "string") {
    candidates.push(path.join(path.resolve(path.dirname(__filename), ".."), TEMPLATE_RELATIVE_PATH));
  }

  if (typeof __dirname === "string") {
    candidates.push(path.join(path.resolve(__dirname, ".."), TEMPLATE_RELATIVE_PATH));
  }

  if (process.argv[1]) {
    candidates.push(path.join(path.resolve(path.dirname(process.argv[1]), ".."), TEMPLATE_RELATIVE_PATH));
  }

  candidates.push(path.join(process.cwd(), ".agents", "skills", "notion-notes", TEMPLATE_RELATIVE_PATH));

  return [...new Set(candidates)];
}
