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

import {TemplateContractError, type ValidationIssue} from "./errors";
import type {NotesData} from "./schema";

const TITLE_PLACEHOLDER = "__NOTION_NOTES_TITLE__";
const DATA_PLACEHOLDER = "__NOTION_NOTES_DATA__";
const REQUIRED_DOM_IDS = [
  "notes-root",
  "toc",
  "selection-toolbar",
  "highlights-panel",
  "json-connect-panel"
];
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;"
};

type PrimitiveDisplayValue = string | number | boolean | bigint | null | undefined;

/** Validates that the HTML template still exposes the expected product hooks. */
export function validateTemplate(template: string): void {
  const issues: ValidationIssue[] = [];
  requireExactlyOnce(template, TITLE_PLACEHOLDER, TITLE_PLACEHOLDER, issues);
  requireExactlyOnce(template, DATA_PLACEHOLDER, DATA_PLACEHOLDER, issues);

  for (const id of REQUIRED_DOM_IDS) {
    if (!hasDomId(template, id)) {
      issues.push({path: `template#${id}`, message: `missing DOM id ${id}.`});
    }
  }

  requireText(template, "Green", "template.controls.green", issues);
  requireText(template, "Yellow", "template.controls.yellow", issues);
  requireText(template, "Red", "template.controls.red", issues);
  requireText(template, "Clear", "template.controls.clear", issues);
  requireText(template, "Highlights", "template.controls.highlights", issues);
  requireText(template, "Connect JSON", "template.controls.connectJson", issues);
  requireText(template, "Show Answer", "template.controls.showAnswer", issues);
  requireText(template, "Hide Answer", "template.controls.hideAnswer", issues);
  requireText(template, "renderSources", "template.sources.renderPath", issues);
  requireText(template, "id=\"sources\"", "template.sources.dom", issues);
  requireCssBraceBalance(template, issues);

  if (issues.length) {
    throw new TemplateContractError(issues);
  }
}

/** Escapes HTML text inserted into document metadata and title nodes. */
export function escapeHtml(value: PrimitiveDisplayValue): string {
  let text = "";
  if (value !== null && value !== undefined) {
    const valueType = typeof value;
    if (
      valueType === "string" ||
      valueType === "number" ||
      valueType === "boolean" ||
      valueType === "bigint"
    ) {
      text = String(value);
    }
  }
  return text.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] || char);
}

/** Serializes notes data safely for an application/json script element. */
export function serializeDataForHtml(data: NotesData): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Replaces the two template placeholders with escaped title and JSON data. */
export function renderTemplate(template: string, data: NotesData): string {
  validateTemplate(template);
  return template
    .replace(TITLE_PLACEHOLDER, escapeHtml(data.metadata.title))
    .replace(DATA_PLACEHOLDER, serializeDataForHtml(data));
}

function requireExactlyOnce(
  template: string,
  token: string,
  path: string,
  issues: ValidationIssue[]
): void {
  const count = countOccurrences(template, token);
  if (count !== 1) {
    issues.push({path, message: `must appear exactly once, found ${count}.`});
  }
}

function requireText(
  template: string,
  text: string,
  path: string,
  issues: ValidationIssue[]
): void {
  if (!template.includes(text)) {
    issues.push({path, message: `missing ${text}.`});
  }
}

function requireCssBraceBalance(template: string, issues: ValidationIssue[]): void {
  const stylePattern = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const blocks = Array.from(template.matchAll(stylePattern), (match) => match[1] || "");
  blocks.forEach((css, index) => {
    const opens = countOccurrences(css, "{");
    const closes = countOccurrences(css, "}");
    if (opens !== closes) {
      issues.push({
        path: `template.style[${index}]`,
        message: `CSS brace balance failed: ${opens} open, ${closes} close.`
      });
    }
  });
}

function hasDomId(template: string, id: string): boolean {
  return new RegExp(`\\bid=["']${escapeRegExp(id)}["']`).test(template);
}

function countOccurrences(value: string, token: string): number {
  return value.split(token).length - 1;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
