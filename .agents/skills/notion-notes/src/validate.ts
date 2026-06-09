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

import {DataValidationError, type ValidationIssue} from "./errors";
import type {
  Callout,
  Citation,
  Command,
  CompletionQuestion,
  Highlight,
  McqQuestion,
  Metadata,
  NotesData,
  Question,
  Section,
  TrueFalseQuestion,
  WrittenQuestion
} from "./schema";

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const VALID_HIGHLIGHT_COLORS = new Set(["green", "yellow", "red"]);
const VALID_HIGHLIGHT_SCOPES = new Set(["summary", "quick-review"]);

interface CommonQuestionFields {
  id: string;
  sectionId?: string;
  source?: string;
  question: string;
}

/** Validates unknown renderer input and returns trusted notes data. */
export function validateData(data: unknown): NotesData {
  const issues: ValidationIssue[] = [];
  if (!isRecord(data)) {
    throw new DataValidationError([{path: "$", message: "data must be an object."}]);
  }

  const metadata = validateMetadata(data["metadata"], issues);
  const summary = validateStringArray(data["summary"], "summary", issues, {
    requireNonEmpty: true
  });
  const sections = validateSections(data["sections"], issues);
  const quickReview = validateStringArray(data["quickReview"], "quickReview", issues);
  const citations = validateCitations(data["citations"], issues);
  const citationIds = new Set(citations.map((citation) => citation.id));
  const sectionIds = new Set(sections.map((section) => section.id));

  validateSectionCitationReferences(sections, citationIds, issues);
  const questions = validateQuestions(data["questions"], sectionIds, issues);
  const highlights = validateHighlights(data["highlights"], sectionIds, issues);

  if (issues.length) {
    throw new DataValidationError(issues);
  }

  return {
    metadata,
    summary,
    sections,
    quickReview,
    citations,
    questions,
    highlights
  };
}

/** Validates metadata fields required by the template and save-back logic. */
export function validateMetadata(value: unknown, issues: ValidationIssue[]): Metadata {
  const metadata = recordOrIssue(value, "metadata", issues);
  return {
    title: requiredString(metadata["title"], "metadata.title", issues),
    sourceTitle: requiredString(metadata["sourceTitle"], "metadata.sourceTitle", issues, {
      allowEmpty: true
    }),
    sourceUrl: requiredString(metadata["sourceUrl"], "metadata.sourceUrl", issues, {
      allowEmpty: true
    }),
    factCheckMode: requiredString(metadata["factCheckMode"], "metadata.factCheckMode", issues, {
      allowEmpty: true
    }),
    generatedAt: requiredString(metadata["generatedAt"], "metadata.generatedAt", issues),
    outputName: requiredString(metadata["outputName"], "metadata.outputName", issues, {
      allowEmpty: true
    }),
    htmlFileName: requiredString(metadata["htmlFileName"], "metadata.htmlFileName", issues),
    jsonFileName: requiredString(metadata["jsonFileName"], "metadata.jsonFileName", issues)
  };
}

/** Validates section IDs, titles, body items, and optional rich blocks. */
export function validateSections(value: unknown, issues: ValidationIssue[]): Section[] {
  const rawSections = requiredArray(value, "sections", issues, {requireNonEmpty: true});
  const sections: Section[] = [];
  const sectionIds = new Set<string>();

  rawSections.forEach((rawSection, index) => {
    const path = `sections[${index}]`;
    if (!isRecord(rawSection)) {
      addIssue(issues, path, "section must be an object.");
      return;
    }
    const id = requiredId(rawSection["id"], `${path}.id`, "section", issues);
    if (id && sectionIds.has(id)) {
      addIssue(issues, `${path}.id`, `duplicate section id ${id}.`);
    }
    if (id) {
      sectionIds.add(id);
    }

    const section: Section = {
      id,
      title: requiredString(rawSection["title"], `${path}.title`, issues),
      items: validateStringArray(rawSection["items"], `${path}.items`, issues, {
        requireNonEmpty: true
      })
    };
    const examples = validateCalloutArray(rawSection["examples"], `${path}.examples`, issues);
    if (examples !== undefined) section.examples = examples;
    const commands = validateCommandArray(rawSection["commands"], `${path}.commands`, issues);
    if (commands !== undefined) section.commands = commands;
    const mistakes = validateOptionalStringArray(rawSection["mistakes"], `${path}.mistakes`, issues);
    if (mistakes !== undefined) section.mistakes = mistakes;
    const citations = validateOptionalStringArray(rawSection["citations"], `${path}.citations`, issues);
    if (citations !== undefined) section.citations = citations;
    sections.push(section);
  });

  return sections;
}

/** Validates citation IDs, labels, and public fact-check URL protocols. */
export function validateCitations(value: unknown, issues: ValidationIssue[]): Citation[] {
  const rawCitations = requiredArray(value, "citations", issues);
  const citations: Citation[] = [];
  const citationIds = new Set<string>();

  rawCitations.forEach((rawCitation, index) => {
    const path = `citations[${index}]`;
    if (!isRecord(rawCitation)) {
      addIssue(issues, path, "citation must be an object.");
      return;
    }
    const id = requiredId(rawCitation["id"], `${path}.id`, "citation", issues);
    if (id && citationIds.has(id)) {
      addIssue(issues, `${path}.id`, `duplicate citation id ${id}.`);
    }
    if (id) {
      citationIds.add(id);
    }
    const url = requiredString(rawCitation["url"], `${path}.url`, issues);
    if (url) {
      validateHttpUrl(url, `${path}.url`, issues);
    }

    const citation: Citation = {
      id,
      label: requiredString(rawCitation["label"], `${path}.label`, issues),
      url
    };
    const note = optionalString(rawCitation["note"], `${path}.note`, issues);
    if (note !== undefined) citation.note = note;
    citations.push(citation);
  });

  return citations;
}

/** Validates all supported discriminated question records. */
export function validateQuestions(
  value: unknown,
  sectionIds: ReadonlySet<string>,
  issues: ValidationIssue[]
): Question[] {
  const rawQuestions = requiredArray(value, "questions", issues, {requireNonEmpty: true});
  const questions: Question[] = [];
  const questionIds = new Set<string>();

  rawQuestions.forEach((rawQuestion, index) => {
    const path = `questions[${index}]`;
    if (!isRecord(rawQuestion)) {
      addIssue(issues, path, "question must be an object.");
      return;
    }
    const testType = requiredString(rawQuestion["testType"], `${path}.testType`, issues);
    const common = validateCommonQuestionFields(rawQuestion, path, sectionIds, issues);
    if (common.id && questionIds.has(common.id)) {
      addIssue(issues, `${path}.id`, `duplicate question id ${common.id}.`);
    }
    if (common.id) {
      questionIds.add(common.id);
    }

    switch (testType) {
      case "tf":
        questions.push(validateTrueFalseQuestion(rawQuestion, path, common, issues));
        break;
      case "mcq":
        questions.push(validateMcqQuestion(rawQuestion, path, common, issues));
        break;
      case "completion":
        questions.push(validateCompletionQuestion(rawQuestion, path, common, issues));
        break;
      case "written":
        questions.push(validateWrittenQuestion(rawQuestion, path, common, issues));
        break;
      default:
        addIssue(issues, `${path}.testType`, `unsupported testType ${testType}.`);
        break;
    }
  });

  return questions;
}

/** Validates saved highlights without trusting browser-written JSON. */
export function validateHighlights(
  value: unknown,
  sectionIds: ReadonlySet<string>,
  issues: ValidationIssue[]
): Highlight[] {
  const rawHighlights = requiredArray(value, "highlights", issues);
  const highlights: Highlight[] = [];

  rawHighlights.forEach((rawHighlight, index) => {
    const path = `highlights[${index}]`;
    if (!isRecord(rawHighlight)) {
      addIssue(issues, path, "highlight must be an object.");
      return;
    }

    const color = requiredString(rawHighlight["color"], `${path}.color`, issues);
    if (color && !VALID_HIGHLIGHT_COLORS.has(color)) {
      addIssue(issues, `${path}.color`, "must be green, yellow, or red.");
    }
    const scopeId = optionalString(rawHighlight["scopeId"], `${path}.scopeId`, issues);
    if (scopeId !== undefined &&
        !VALID_HIGHLIGHT_SCOPES.has(scopeId) &&
        !sectionIds.has(scopeId)) {
      addIssue(issues, `${path}.scopeId`, `unknown highlight scope ${scopeId}.`);
    }
    const start = optionalNumber(rawHighlight["start"], `${path}.start`, issues);
    const end = optionalNumber(rawHighlight["end"], `${path}.end`, issues);
    if (start !== undefined && end !== undefined && start >= end) {
      addIssue(issues, `${path}.end`, "must be greater than start.");
    }

    const highlight: Highlight = {
      color: VALID_HIGHLIGHT_COLORS.has(color) ?
        (color as Highlight["color"]) :
        "green"
    };
    assignOptionalString(highlight, "id", rawHighlight["id"], `${path}.id`, issues);
    assignOptionalString(highlight, "text", rawHighlight["text"], `${path}.text`, issues);
    if (scopeId !== undefined) highlight.scopeId = scopeId;
    assignOptionalString(
      highlight,
      "sectionTitle",
      rawHighlight["sectionTitle"],
      `${path}.sectionTitle`,
      issues
    );
    if (start !== undefined) highlight.start = start;
    if (end !== undefined) highlight.end = end;
    assignOptionalString(
      highlight,
      "createdAt",
      rawHighlight["createdAt"],
      `${path}.createdAt`,
      issues
    );
    assignOptionalString(
      highlight,
      "updatedAt",
      rawHighlight["updatedAt"],
      `${path}.updatedAt`,
      issues
    );
    highlights.push(highlight);
  });

  return highlights;
}

function validateSectionCitationReferences(
  sections: readonly Section[],
  citationIds: ReadonlySet<string>,
  issues: ValidationIssue[]
): void {
  sections.forEach((section, sectionIndex) => {
    (section.citations || []).forEach((citationId, citationIndex) => {
      if (!citationIds.has(citationId)) {
        addIssue(
          issues,
          `sections[${sectionIndex}].citations[${citationIndex}]`,
          `unknown citation ${citationId}.`
        );
      }
    });
  });
}

function validateCommonQuestionFields(
  rawQuestion: Record<string, unknown>,
  path: string,
  sectionIds: ReadonlySet<string>,
  issues: ValidationIssue[]
): CommonQuestionFields {
  const common: CommonQuestionFields = {
    id: requiredId(rawQuestion["id"], `${path}.id`, "question", issues),
    question: requiredString(rawQuestion["question"], `${path}.question`, issues)
  };
  const sectionId = optionalString(rawQuestion["sectionId"], `${path}.sectionId`, issues);
  if (sectionId !== undefined) {
    if (!sectionIds.has(sectionId)) {
      addIssue(issues, `${path}.sectionId`, `unknown section ${sectionId}.`);
    }
    common.sectionId = sectionId;
  }
  const source = optionalString(rawQuestion["source"], `${path}.source`, issues);
  if (source !== undefined) {
    common.source = source;
  }
  return common;
}

function validateTrueFalseQuestion(
  rawQuestion: Record<string, unknown>,
  path: string,
  common: CommonQuestionFields,
  issues: ValidationIssue[]
): TrueFalseQuestion {
  const answer = rawQuestion["answer"];
  if (!(answer === true || answer === false || answer === "true" || answer === "false")) {
    addIssue(issues, `${path}.answer`, "must be true or false.");
  }
  return {
    ...common,
    testType: "tf",
    answer: answer === false || answer === "false" ? false : true
  };
}

function validateMcqQuestion(
  rawQuestion: Record<string, unknown>,
  path: string,
  common: CommonQuestionFields,
  issues: ValidationIssue[]
): McqQuestion {
  const options = validateStringRecord(rawQuestion["options"], `${path}.options`, issues);
  if (Object.keys(options).length < 2) {
    addIssue(issues, `${path}.options`, "must contain at least two options.");
  }
  const answer = requiredString(rawQuestion["answer"], `${path}.answer`, issues);
  if (answer && !Object.prototype.hasOwnProperty.call(options, answer)) {
    addIssue(issues, `${path}.answer`, "must match an option key.");
  }
  return {
    ...common,
    testType: "mcq",
    options,
    answer
  };
}

function validateCompletionQuestion(
  rawQuestion: Record<string, unknown>,
  path: string,
  common: CommonQuestionFields,
  issues: ValidationIssue[]
): CompletionQuestion {
  const answerText = optionalString(rawQuestion["answerText"], `${path}.answerText`, issues);
  const acceptedAnswers = validateOptionalStringArray(
    rawQuestion["acceptedAnswers"],
    `${path}.acceptedAnswers`,
    issues
  );
  const hasAnswerText = Boolean(answerText && answerText.trim());
  const hasAcceptedAnswers = Boolean((acceptedAnswers || []).some((answer) => answer.trim()));
  if (!hasAnswerText && !hasAcceptedAnswers) {
    addIssue(issues, `${path}.answerText`, "requires answerText or acceptedAnswers.");
  }
  const question: CompletionQuestion = {
    ...common,
    testType: "completion"
  };
  if (answerText !== undefined) question.answerText = answerText;
  if (acceptedAnswers !== undefined) question.acceptedAnswers = acceptedAnswers;
  return question;
}

function validateWrittenQuestion(
  rawQuestion: Record<string, unknown>,
  path: string,
  common: CommonQuestionFields,
  issues: ValidationIssue[]
): WrittenQuestion {
  const question: WrittenQuestion = {
    ...common,
    testType: "written",
    modelAnswerText: requiredString(rawQuestion["modelAnswerText"], `${path}.modelAnswerText`, issues)
  };
  const keywords = validateOptionalStringArray(rawQuestion["keywords"], `${path}.keywords`, issues);
  if (keywords !== undefined) question.keywords = keywords;
  return question;
}

function validateCalloutArray(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): Callout[] | undefined {
  if (value === undefined) return undefined;
  const rawCallouts = requiredArray(value, path, issues);
  return rawCallouts.map((rawCallout, index) => {
    const calloutPath = `${path}[${index}]`;
    const callout: Callout = {};
    if (!isRecord(rawCallout)) {
      addIssue(issues, calloutPath, "callout must be an object.");
      return callout;
    }
    assignOptionalString(callout, "title", rawCallout["title"], `${calloutPath}.title`, issues);
    assignOptionalString(callout, "body", rawCallout["body"], `${calloutPath}.body`, issues);
    assignOptionalString(callout, "code", rawCallout["code"], `${calloutPath}.code`, issues);
    return callout;
  });
}

function validateCommandArray(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): Command[] | undefined {
  const callouts = validateCalloutArray(value, path, issues);
  return callouts === undefined ? undefined : callouts;
}

function validateStringRecord(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): Record<string, string> {
  if (!isRecord(value)) {
    addIssue(issues, path, "must be an object.");
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (!key.trim()) {
      addIssue(issues, `${path}.${key}`, "option key must not be empty.");
      continue;
    }
    if (typeof rawValue !== "string" || !rawValue.trim()) {
      addIssue(issues, `${path}.${key}`, "option value must be a non-empty string.");
      continue;
    }
    result[key] = rawValue;
  }
  return result;
}

function validateOptionalStringArray(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): string[] | undefined {
  if (value === undefined) return undefined;
  return validateStringArray(value, path, issues);
}

function validateStringArray(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  options: {requireNonEmpty?: boolean} = {}
): string[] {
  const rawItems = requiredArray(value, path, issues, options);
  const items: string[] = [];
  rawItems.forEach((rawItem, index) => {
    if (typeof rawItem !== "string" || !rawItem.trim()) {
      addIssue(issues, `${path}[${index}]`, "must be a non-empty string.");
      return;
    }
    items.push(rawItem);
  });
  return items;
}

function requiredArray(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  options: {requireNonEmpty?: boolean} = {}
): unknown[] {
  if (!Array.isArray(value)) {
    addIssue(issues, path, "must be an array.");
    return [];
  }
  if (options.requireNonEmpty && value.length === 0) {
    addIssue(issues, path, "must contain at least one item.");
  }
  return value;
}

function requiredId(
  value: unknown,
  path: string,
  label: string,
  issues: ValidationIssue[]
): string {
  const id = requiredString(value, path, issues);
  if (id && !ID_PATTERN.test(id)) {
    addIssue(issues, path, `${label} id must be kebab-case.`);
  }
  return id;
}

function requiredString(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  options: {allowEmpty?: boolean} = {}
): string {
  if (typeof value !== "string") {
    addIssue(issues, path, "must be a string.");
    return "";
  }
  if (!options.allowEmpty && !value.trim()) {
    addIssue(issues, path, "must not be empty.");
  }
  return value;
}

function optionalString(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    addIssue(issues, path, "must be a string when provided.");
    return undefined;
  }
  return value;
}

function optionalNumber(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    addIssue(issues, path, "must be a finite number when provided.");
    return undefined;
  }
  return value;
}

function assignOptionalString<T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): void {
  const result = optionalString(value, path, issues);
  if (result !== undefined) {
    target[key] = result as T[K];
  }
}

function validateHttpUrl(
  value: string,
  path: string,
  issues: ValidationIssue[]
): void {
  try {
    const protocol = new URL(value).protocol;
    if (protocol !== "http:" && protocol !== "https:") {
      addIssue(issues, path, "must use http or https.");
    }
  } catch {
    addIssue(issues, path, "must be a valid URL.");
  }
}

function recordOrIssue(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): Record<string, unknown> {
  if (!isRecord(value)) {
    addIssue(issues, path, "must be an object.");
    return {};
  }
  return value;
}

function addIssue(issues: ValidationIssue[], path: string, message: string): void {
  issues.push({path, message});
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
