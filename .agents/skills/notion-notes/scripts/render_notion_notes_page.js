#!/usr/bin/env node
"use strict";

/**
 * Generated JavaScript runtime for the notion-notes renderer.
 * TypeScript source remains canonical in ../src.
 * Source fingerprint: 3392ab833d7f7de97ec325300881b48a24980174bf5f1402bce3c24e19f77409
 */

const fs = require("node:fs");
const path = require("node:path");

const USAGE_EXIT_CODE = 2;
const VALIDATION_EXIT_CODE = 65;
const FILESYSTEM_EXIT_CODE = 74;
const HTML_EXTENSION_PATTERN = /\.html?$/i;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const VALID_HIGHLIGHT_COLORS = new Set(["green", "yellow", "red"]);
const VALID_HIGHLIGHT_SCOPES = new Set(["summary", "quick-review"]);
const TITLE_PLACEHOLDER = "__NOTION_NOTES_TITLE__";
const DATA_PLACEHOLDER = "__NOTION_NOTES_DATA__";
const REQUIRED_DOM_IDS = [
  "notes-root",
  "toc",
  "selection-toolbar",
  "highlights-panel",
  "json-connect-panel"
];
const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;"
};
const TEMPLATE_RELATIVE_PATH = path.join("assets", "html-template", "template.html");

class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
    this.exitCode = USAGE_EXIT_CODE;
  }
}

class DataValidationError extends Error {
  constructor(issues) {
    super(`Validation failed with ${issues.length} issue(s).`);
    this.name = "DataValidationError";
    this.exitCode = VALIDATION_EXIT_CODE;
    this.issues = issues;
  }
}

class TemplateContractError extends Error {
  constructor(issues) {
    super(`Template contract failed with ${issues.length} issue(s).`);
    this.name = "TemplateContractError";
    this.exitCode = VALIDATION_EXIT_CODE;
    this.issues = issues;
  }
}

class FileSystemRenderError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "FileSystemRenderError";
    this.exitCode = FILESYSTEM_EXIT_CODE;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

function usageText() {
  return [
    "Usage: node .agents/skills/notion-notes/scripts/render_notion_notes_page.js input.json [output_dir|output.html]",
    "  Default output_dir is ./Notes, which writes ./Notes/<slug>/<slug>.json and .html."
  ].join("\n");
}

function parseCliArgs(argv) {
  const args = argv.slice(2);
  if (args.length < 1 || args.length > 2 || !args[0]) {
    throw new UsageError(usageText());
  }
  return {
    inputPath: path.resolve(args[0]),
    outputTarget: args[1] ? path.resolve(args[1]) : undefined
  };
}

function runCli(argv = process.argv) {
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

function main() {
  const exitCode = runCli(process.argv);
  if (exitCode !== 0) {
    process.exitCode = exitCode || USAGE_EXIT_CODE;
  }
}

function exitCodeForError(error) {
  if (
    error instanceof UsageError ||
    error instanceof DataValidationError ||
    error instanceof TemplateContractError ||
    error instanceof FileSystemRenderError
  ) {
    return error.exitCode;
  }
  return FILESYSTEM_EXIT_CODE;
}

function formatError(error) {
  if (error instanceof DataValidationError || error instanceof TemplateContractError) {
    return [
      error.message,
      ...error.issues.map((issue) => `- ${issue.path}: ${issue.message}`)
    ].join("\n");
  }
  if (error instanceof UsageError || error instanceof FileSystemRenderError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unknown renderer error.";
}

function renderPage(inputPath, outputTarget, options = {}) {
  const resolvedInputPath = path.resolve(inputPath);
  const sourceData = readJsonUnknown(resolvedInputPath);
  const renderPlan = resolveRenderPlan(resolvedInputPath, outputTarget, sourceData);
  const normalizedUnknown = normalizeInput(sourceData, {
    outputPath: renderPlan.outputPath,
    generatedAt: options.generatedAt
  });
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

function resolveDefaultTemplatePath() {
  const candidates = defaultTemplatePathCandidates();
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0] || path.join("assets", "html-template", "template.html");
}

function defaultTemplatePathCandidates() {
  const candidates = [];

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

function readUtf8(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    throw new FileSystemRenderError(`Could not read ${filePath}.`, error);
  }
}

function readJsonUnknown(filePath) {
  const raw = readUtf8(filePath);
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new FileSystemRenderError(`Could not parse JSON from ${filePath}.`, error);
  }
}

function ensureDirectory(dirPath) {
  try {
    fs.mkdirSync(dirPath, {recursive: true});
  } catch (error) {
    throw new FileSystemRenderError(`Could not create directory ${dirPath}.`, error);
  }
}

function atomicWriteUtf8(filePath, content) {
  const directory = path.dirname(filePath);
  const baseName = path.basename(filePath);
  const tempPath = path.join(directory, `.${baseName}.${process.pid}.${Date.now()}.tmp`);
  let fd = null;

  try {
    fd = fs.openSync(tempPath, "wx");
    fs.writeFileSync(fd, content, "utf8");
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {
        /* Keep the original write failure. */
      }
    }
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch {
      /* Best-effort cleanup. */
    }
    throw new FileSystemRenderError(`Could not write ${filePath}.`, error);
  }
}

function isHtmlOutputTarget(value) {
  return HTML_EXTENSION_PATTERN.test(String(value || ""));
}

function matchingJsonFileName(outputPath) {
  const extension = path.extname(outputPath || "");
  const baseName = path.basename(outputPath || "notion-notes.html", extension);
  return `${baseName || "notion-notes"}.json`;
}

function slugifyOutputName(value) {
  const raw = typeof value === "string" ? value : "";
  const normalized = raw
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "notes";
}

function outputSlugForInput(input, inputPath) {
  const metadata = isRecord(input) && isRecord(input.metadata) ? input.metadata : {};
  const fallbackName = path.basename(inputPath, path.extname(inputPath));
  return slugifyOutputName(
    firstNonEmptyString([
      metadata.outputName,
      metadata.sourceTitle,
      metadata.title,
      fallbackName
    ])
  );
}

function resolveRenderPlan(inputPath, outputTarget, input) {
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

  const outputRoot = outputTarget ? path.resolve(outputTarget) : path.resolve(process.cwd(), "Notes");
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

function normalizeInput(input, options) {
  const source = isRecord(input) ? input : {};
  const metadata = isRecord(source.metadata) ? source.metadata : {};
  const generatedAt = firstNonEmptyString([metadata.generatedAt, options.generatedAt]) ||
    currentDateStamp();
  const title = firstNonEmptyString([metadata.title, metadata.sourceTitle]) ||
    "Notion Notes";

  return {
    metadata: {
      title,
      sourceTitle: stringOrEmpty(metadata.sourceTitle),
      sourceUrl: stringOrEmpty(metadata.sourceUrl),
      factCheckMode: firstNonEmptyString([metadata.factCheckMode]) ||
        "cited verification",
      generatedAt,
      outputName: stringOrEmpty(metadata.outputName),
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

function valueOrDefault(source, key, fallback) {
  return Object.prototype.hasOwnProperty.call(source, key) ? source[key] : fallback;
}

function stringOrEmpty(value) {
  return typeof value === "string" ? value : "";
}

function currentDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function validateData(data) {
  const issues = [];
  if (!isRecord(data)) {
    throw new DataValidationError([{path: "$", message: "data must be an object."}]);
  }

  const metadata = validateMetadata(data.metadata, issues);
  const summary = validateStringArray(data.summary, "summary", issues, {requireNonEmpty: true});
  const sections = validateSections(data.sections, issues);
  const quickReview = validateStringArray(data.quickReview, "quickReview", issues);
  const citations = validateCitations(data.citations, issues);
  const citationIds = new Set(citations.map((citation) => citation.id));
  const sectionIds = new Set(sections.map((section) => section.id));

  validateSectionCitationReferences(sections, citationIds, issues);
  const questions = validateQuestions(data.questions, sectionIds, issues);
  const highlights = validateHighlights(data.highlights, sectionIds, issues);

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

function validateMetadata(value, issues) {
  const metadata = recordOrIssue(value, "metadata", issues);
  return {
    title: requiredString(metadata.title, "metadata.title", issues),
    sourceTitle: requiredString(metadata.sourceTitle, "metadata.sourceTitle", issues, {allowEmpty: true}),
    sourceUrl: requiredString(metadata.sourceUrl, "metadata.sourceUrl", issues, {allowEmpty: true}),
    factCheckMode: requiredString(metadata.factCheckMode, "metadata.factCheckMode", issues, {allowEmpty: true}),
    generatedAt: requiredString(metadata.generatedAt, "metadata.generatedAt", issues),
    outputName: requiredString(metadata.outputName, "metadata.outputName", issues, {allowEmpty: true}),
    htmlFileName: requiredString(metadata.htmlFileName, "metadata.htmlFileName", issues),
    jsonFileName: requiredString(metadata.jsonFileName, "metadata.jsonFileName", issues)
  };
}

function validateSections(value, issues) {
  const rawSections = requiredArray(value, "sections", issues, {requireNonEmpty: true});
  const sections = [];
  const sectionIds = new Set();

  rawSections.forEach((rawSection, index) => {
    const issuePath = `sections[${index}]`;
    if (!isRecord(rawSection)) {
      addIssue(issues, issuePath, "section must be an object.");
      return;
    }
    const id = requiredId(rawSection.id, `${issuePath}.id`, "section", issues);
    if (id && sectionIds.has(id)) {
      addIssue(issues, `${issuePath}.id`, `duplicate section id ${id}.`);
    }
    if (id) {
      sectionIds.add(id);
    }

    const section = {
      id,
      title: requiredString(rawSection.title, `${issuePath}.title`, issues),
      items: validateStringArray(rawSection.items, `${issuePath}.items`, issues, {requireNonEmpty: true})
    };
    const examples = validateCalloutArray(rawSection.examples, `${issuePath}.examples`, issues);
    if (examples !== undefined) section.examples = examples;
    const commands = validateCommandArray(rawSection.commands, `${issuePath}.commands`, issues);
    if (commands !== undefined) section.commands = commands;
    const mistakes = validateOptionalStringArray(rawSection.mistakes, `${issuePath}.mistakes`, issues);
    if (mistakes !== undefined) section.mistakes = mistakes;
    const citations = validateOptionalStringArray(rawSection.citations, `${issuePath}.citations`, issues);
    if (citations !== undefined) section.citations = citations;
    sections.push(section);
  });

  return sections;
}

function validateCitations(value, issues) {
  const rawCitations = requiredArray(value, "citations", issues);
  const citations = [];
  const citationIds = new Set();

  rawCitations.forEach((rawCitation, index) => {
    const issuePath = `citations[${index}]`;
    if (!isRecord(rawCitation)) {
      addIssue(issues, issuePath, "citation must be an object.");
      return;
    }
    const id = requiredId(rawCitation.id, `${issuePath}.id`, "citation", issues);
    if (id && citationIds.has(id)) {
      addIssue(issues, `${issuePath}.id`, `duplicate citation id ${id}.`);
    }
    if (id) {
      citationIds.add(id);
    }
    const url = requiredString(rawCitation.url, `${issuePath}.url`, issues);
    if (url) {
      validateHttpUrl(url, `${issuePath}.url`, issues);
    }

    const citation = {
      id,
      label: requiredString(rawCitation.label, `${issuePath}.label`, issues),
      url
    };
    const note = optionalString(rawCitation.note, `${issuePath}.note`, issues);
    if (note !== undefined) citation.note = note;
    citations.push(citation);
  });

  return citations;
}

function validateQuestions(value, sectionIds, issues) {
  const rawQuestions = requiredArray(value, "questions", issues, {requireNonEmpty: true});
  const questions = [];
  const questionIds = new Set();

  rawQuestions.forEach((rawQuestion, index) => {
    const issuePath = `questions[${index}]`;
    if (!isRecord(rawQuestion)) {
      addIssue(issues, issuePath, "question must be an object.");
      return;
    }
    const testType = requiredString(rawQuestion.testType, `${issuePath}.testType`, issues);
    const common = validateCommonQuestionFields(rawQuestion, issuePath, sectionIds, issues);
    if (common.id && questionIds.has(common.id)) {
      addIssue(issues, `${issuePath}.id`, `duplicate question id ${common.id}.`);
    }
    if (common.id) {
      questionIds.add(common.id);
    }

    switch (testType) {
      case "tf":
        questions.push(validateTrueFalseQuestion(rawQuestion, issuePath, common, issues));
        break;
      case "mcq":
        questions.push(validateMcqQuestion(rawQuestion, issuePath, common, issues));
        break;
      case "completion":
        questions.push(validateCompletionQuestion(rawQuestion, issuePath, common, issues));
        break;
      case "written":
        questions.push(validateWrittenQuestion(rawQuestion, issuePath, common, issues));
        break;
      default:
        addIssue(issues, `${issuePath}.testType`, `unsupported testType ${testType}.`);
        break;
    }
  });

  return questions;
}

function validateHighlights(value, sectionIds, issues) {
  const rawHighlights = requiredArray(value, "highlights", issues);
  const highlights = [];

  rawHighlights.forEach((rawHighlight, index) => {
    const issuePath = `highlights[${index}]`;
    if (!isRecord(rawHighlight)) {
      addIssue(issues, issuePath, "highlight must be an object.");
      return;
    }

    const color = requiredString(rawHighlight.color, `${issuePath}.color`, issues);
    if (color && !VALID_HIGHLIGHT_COLORS.has(color)) {
      addIssue(issues, `${issuePath}.color`, "must be green, yellow, or red.");
    }
    const scopeId = optionalString(rawHighlight.scopeId, `${issuePath}.scopeId`, issues);
    if (
      scopeId !== undefined &&
      !VALID_HIGHLIGHT_SCOPES.has(scopeId) &&
      !sectionIds.has(scopeId)
    ) {
      addIssue(issues, `${issuePath}.scopeId`, `unknown highlight scope ${scopeId}.`);
    }
    const start = optionalNumber(rawHighlight.start, `${issuePath}.start`, issues);
    const end = optionalNumber(rawHighlight.end, `${issuePath}.end`, issues);
    if (start !== undefined && end !== undefined && start >= end) {
      addIssue(issues, `${issuePath}.end`, "must be greater than start.");
    }

    const highlight = {
      color: VALID_HIGHLIGHT_COLORS.has(color) ? color : "green"
    };
    assignOptionalString(highlight, "id", rawHighlight.id, `${issuePath}.id`, issues);
    assignOptionalString(highlight, "text", rawHighlight.text, `${issuePath}.text`, issues);
    if (scopeId !== undefined) highlight.scopeId = scopeId;
    assignOptionalString(highlight, "sectionTitle", rawHighlight.sectionTitle, `${issuePath}.sectionTitle`, issues);
    if (start !== undefined) highlight.start = start;
    if (end !== undefined) highlight.end = end;
    assignOptionalString(highlight, "createdAt", rawHighlight.createdAt, `${issuePath}.createdAt`, issues);
    assignOptionalString(highlight, "updatedAt", rawHighlight.updatedAt, `${issuePath}.updatedAt`, issues);
    highlights.push(highlight);
  });

  return highlights;
}

function validateSectionCitationReferences(sections, citationIds, issues) {
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

function validateCommonQuestionFields(rawQuestion, issuePath, sectionIds, issues) {
  const common = {
    id: requiredId(rawQuestion.id, `${issuePath}.id`, "question", issues),
    question: requiredString(rawQuestion.question, `${issuePath}.question`, issues)
  };
  const sectionId = optionalString(rawQuestion.sectionId, `${issuePath}.sectionId`, issues);
  if (sectionId !== undefined) {
    if (!sectionIds.has(sectionId)) {
      addIssue(issues, `${issuePath}.sectionId`, `unknown section ${sectionId}.`);
    }
    common.sectionId = sectionId;
  }
  const source = optionalString(rawQuestion.source, `${issuePath}.source`, issues);
  if (source !== undefined) {
    common.source = source;
  }
  return common;
}

function validateTrueFalseQuestion(rawQuestion, issuePath, common, issues) {
  const answer = rawQuestion.answer;
  if (!(answer === true || answer === false || answer === "true" || answer === "false")) {
    addIssue(issues, `${issuePath}.answer`, "must be true or false.");
  }
  return {
    ...common,
    testType: "tf",
    answer: answer === false || answer === "false" ? false : true
  };
}

function validateMcqQuestion(rawQuestion, issuePath, common, issues) {
  const options = validateStringRecord(rawQuestion.options, `${issuePath}.options`, issues);
  if (Object.keys(options).length < 2) {
    addIssue(issues, `${issuePath}.options`, "must contain at least two options.");
  }
  const answer = requiredString(rawQuestion.answer, `${issuePath}.answer`, issues);
  if (answer && !Object.prototype.hasOwnProperty.call(options, answer)) {
    addIssue(issues, `${issuePath}.answer`, "must match an option key.");
  }
  return {
    ...common,
    testType: "mcq",
    options,
    answer
  };
}

function validateCompletionQuestion(rawQuestion, issuePath, common, issues) {
  const answerText = optionalString(rawQuestion.answerText, `${issuePath}.answerText`, issues);
  const acceptedAnswers = validateOptionalStringArray(rawQuestion.acceptedAnswers, `${issuePath}.acceptedAnswers`, issues);
  const hasAnswerText = Boolean(answerText && answerText.trim());
  const hasAcceptedAnswers = Boolean((acceptedAnswers || []).some((answer) => answer.trim()));
  if (!hasAnswerText && !hasAcceptedAnswers) {
    addIssue(issues, `${issuePath}.answerText`, "requires answerText or acceptedAnswers.");
  }
  const question = {
    ...common,
    testType: "completion"
  };
  if (answerText !== undefined) question.answerText = answerText;
  if (acceptedAnswers !== undefined) question.acceptedAnswers = acceptedAnswers;
  return question;
}

function validateWrittenQuestion(rawQuestion, issuePath, common, issues) {
  const question = {
    ...common,
    testType: "written",
    modelAnswerText: requiredString(rawQuestion.modelAnswerText, `${issuePath}.modelAnswerText`, issues)
  };
  const keywords = validateOptionalStringArray(rawQuestion.keywords, `${issuePath}.keywords`, issues);
  if (keywords !== undefined) question.keywords = keywords;
  return question;
}

function validateCalloutArray(value, issuePath, issues) {
  if (value === undefined) return undefined;
  const rawCallouts = requiredArray(value, issuePath, issues);
  return rawCallouts.map((rawCallout, index) => {
    const calloutPath = `${issuePath}[${index}]`;
    const callout = {};
    if (!isRecord(rawCallout)) {
      addIssue(issues, calloutPath, "callout must be an object.");
      return callout;
    }
    assignOptionalString(callout, "title", rawCallout.title, `${calloutPath}.title`, issues);
    assignOptionalString(callout, "body", rawCallout.body, `${calloutPath}.body`, issues);
    assignOptionalString(callout, "code", rawCallout.code, `${calloutPath}.code`, issues);
    return callout;
  });
}

function validateCommandArray(value, issuePath, issues) {
  const callouts = validateCalloutArray(value, issuePath, issues);
  return callouts === undefined ? undefined : callouts;
}

function validateStringRecord(value, issuePath, issues) {
  if (!isRecord(value)) {
    addIssue(issues, issuePath, "must be an object.");
    return {};
  }
  const result = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (!key.trim()) {
      addIssue(issues, `${issuePath}.${key}`, "option key must not be empty.");
      continue;
    }
    if (typeof rawValue !== "string" || !rawValue.trim()) {
      addIssue(issues, `${issuePath}.${key}`, "option value must be a non-empty string.");
      continue;
    }
    result[key] = rawValue;
  }
  return result;
}

function validateOptionalStringArray(value, issuePath, issues) {
  if (value === undefined) return undefined;
  return validateStringArray(value, issuePath, issues);
}

function validateStringArray(value, issuePath, issues, options = {}) {
  const rawItems = requiredArray(value, issuePath, issues, options);
  const items = [];
  rawItems.forEach((rawItem, index) => {
    if (typeof rawItem !== "string" || !rawItem.trim()) {
      addIssue(issues, `${issuePath}[${index}]`, "must be a non-empty string.");
      return;
    }
    items.push(rawItem);
  });
  return items;
}

function requiredArray(value, issuePath, issues, options = {}) {
  if (!Array.isArray(value)) {
    addIssue(issues, issuePath, "must be an array.");
    return [];
  }
  if (options.requireNonEmpty && value.length === 0) {
    addIssue(issues, issuePath, "must contain at least one item.");
  }
  return value;
}

function requiredId(value, issuePath, label, issues) {
  const id = requiredString(value, issuePath, issues);
  if (id && !ID_PATTERN.test(id)) {
    addIssue(issues, issuePath, `${label} id must be kebab-case.`);
  }
  return id;
}

function requiredString(value, issuePath, issues, options = {}) {
  if (typeof value !== "string") {
    addIssue(issues, issuePath, "must be a string.");
    return "";
  }
  if (!options.allowEmpty && !value.trim()) {
    addIssue(issues, issuePath, "must not be empty.");
  }
  return value;
}

function optionalString(value, issuePath, issues) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    addIssue(issues, issuePath, "must be a string when provided.");
    return undefined;
  }
  return value;
}

function optionalNumber(value, issuePath, issues) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    addIssue(issues, issuePath, "must be a finite number when provided.");
    return undefined;
  }
  return value;
}

function assignOptionalString(target, key, value, issuePath, issues) {
  const result = optionalString(value, issuePath, issues);
  if (result !== undefined) {
    target[key] = result;
  }
}

function validateHttpUrl(value, issuePath, issues) {
  try {
    const protocol = new URL(value).protocol;
    if (protocol !== "http:" && protocol !== "https:") {
      addIssue(issues, issuePath, "must use http or https.");
    }
  } catch {
    addIssue(issues, issuePath, "must be a valid URL.");
  }
}

function recordOrIssue(value, issuePath, issues) {
  if (!isRecord(value)) {
    addIssue(issues, issuePath, "must be an object.");
    return {};
  }
  return value;
}

function addIssue(issues, issuePath, message) {
  issues.push({path: issuePath, message});
}

function validateTemplate(template) {
  const issues = [];
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

function escapeHtml(value) {
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

function serializeDataForHtml(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function renderTemplate(template, data) {
  validateTemplate(template);
  return template
    .replace(TITLE_PLACEHOLDER, escapeHtml(data.metadata.title))
    .replace(DATA_PLACEHOLDER, serializeDataForHtml(data));
}

function requireExactlyOnce(template, token, issuePath, issues) {
  const count = countOccurrences(template, token);
  if (count !== 1) {
    issues.push({path: issuePath, message: `must appear exactly once, found ${count}.`});
  }
}

function requireText(template, text, issuePath, issues) {
  if (!template.includes(text)) {
    issues.push({path: issuePath, message: `missing ${text}.`});
  }
}

function requireCssBraceBalance(template, issues) {
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

function hasDomId(template, id) {
  return new RegExp(`\\bid=["']${escapeRegExp(id)}["']`).test(template);
}

function countOccurrences(value, token) {
  return value.split(token).length - 1;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstNonEmptyString(values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

if (require.main === module) {
  main();
}

module.exports = {
  build: renderPage,
  DataValidationError,
  exitCodeForError,
  FileSystemRenderError,
  formatError,
  main,
  parseCliArgs,
  renderPage,
  renderTemplate,
  runCli,
  slugifyOutputName,
  TemplateContractError,
  usageText,
  UsageError,
  validateData,
  validateTemplate
};
