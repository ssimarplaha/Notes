"use strict";

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {runCli} from "../src/cli.ts";
import {DataValidationError, exitCodeForError, FileSystemRenderError} from "../src/errors.ts";
import {renderPage} from "../src/renderer.ts";
import {validateData} from "../src/validate.ts";
import {validateTemplate} from "../src/template.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");
const sampleJsonPath = path.join(repoRoot, "Notes", "2605_25_31", "2605_25_31.json");
const templatePath = path.join(repoRoot, ".agents", "skills", "notion-notes", "assets", "html-template", "template.html");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "notion-notes-renderer-"));
}

function validInput(overrides = {}) {
  return {
    metadata: {
      title: "A <Title>",
      sourceTitle: "Source",
      sourceUrl: "https://private.example/notion-page",
      factCheckMode: "cited verification",
      outputName: "My Note",
      ...overrides.metadata
    },
    summary: ["Summary <point>"],
    sections: [
      {
        id: "section-one",
        title: "Section One",
        items: ["Explain the first section."],
        examples: [{title: "Example", body: "Use `code` in prose."}],
        commands: [{title: "Command", code: "echo safe"}],
        mistakes: ["Do not skip validation."],
        citations: ["src-one"],
        ...(overrides.section || {})
      }
    ],
    quickReview: ["Review the first section."],
    citations: [
      {
        id: "src-one",
        label: "Example Source",
        url: "https://example.com/docs",
        note: "Verifies the sample."
      }
    ],
    questions: [
      {
        id: "tf-one",
        testType: "tf",
        sectionId: "section-one",
        source: "Section One",
        question: "Validation runs before writes.",
        answer: true
      },
      {
        id: "mcq-one",
        testType: "mcq",
        sectionId: "section-one",
        source: "Section One",
        question: "Which option is correct?",
        options: {A: "Wrong", B: "Correct"},
        answer: "B"
      },
      {
        id: "completion-one",
        testType: "completion",
        sectionId: "section-one",
        source: "Section One",
        question: "Type the key word.",
        answerText: "validation",
        acceptedAnswers: ["validation"]
      },
      {
        id: "written-one",
        testType: "written",
        sectionId: "section-one",
        source: "Section One",
        question: "Explain the renderer.",
        modelAnswerText: "It validates, embeds JSON, and writes atomically.",
        keywords: ["validates", "JSON", "atomic"]
      }
    ],
    highlights: [],
    ...overrides
  };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function extractEmbeddedData(html) {
  const match = html.match(/<script type="application\/json" id="notion-notes-data">([\s\S]*?)<\/script>/);
  assert.ok(match, "embedded JSON script exists");
  return JSON.parse(match[1]);
}

test("derives directory output and normalized sibling JSON filenames", () => {
  const dir = tempDir();
  const inputPath = path.join(dir, "input.json");
  writeJson(inputPath, validInput());

  const result = renderPage(inputPath, path.join(dir, "Notes"), {
    generatedAt: "2026-06-07"
  });

  assert.equal(result.mode, "directory");
  assert.equal(result.slug, "my_note");
  assert.equal(result.sections, 1);
  assert.equal(result.citations, 1);
  assert.equal(result.questions, 4);
  assert.equal(result.highlights, 0);
  assert.equal(result.jsonFileName, "my_note.json");
  assert.ok(fs.existsSync(result.outputPath));
  assert.ok(result.jsonPath && fs.existsSync(result.jsonPath));
  const normalized = JSON.parse(fs.readFileSync(result.jsonPath, "utf8"));
  assert.equal(normalized.metadata.htmlFileName, "my_note.html");
  assert.equal(normalized.metadata.jsonFileName, "my_note.json");
  assert.equal(normalized.metadata.generatedAt, "2026-06-07");
});

test("explicit HTML preview writes only HTML and expects matching JSON filename", () => {
  const dir = tempDir();
  const inputPath = path.join(dir, "input.json");
  const outputPath = path.join(dir, "preview.html");
  writeJson(inputPath, validInput());

  const result = renderPage(inputPath, outputPath, {
    generatedAt: "2026-06-07"
  });

  assert.equal(result.mode, "explicit");
  assert.equal(result.jsonPath, null);
  assert.equal(result.jsonFileName, "preview.json");
  assert.ok(fs.existsSync(outputPath));
  assert.equal(fs.existsSync(path.join(dir, "preview.json")), false);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /<title>A &lt;Title&gt;<\/title>/);
  assert.match(html, /\\u003cTitle>/);
  assert.equal(extractEmbeddedData(html).metadata.jsonFileName, "preview.json");
});

test("validation reports readable paths for invalid questions and citations", () => {
  const data = validInput({
    metadata: {
      title: "A",
      sourceTitle: "",
      sourceUrl: "",
      factCheckMode: "cited verification",
      generatedAt: "2026-06-07",
      outputName: "",
      htmlFileName: "a.html",
      jsonFileName: "a.json"
    }
  });
  data.questions[1].answer = "Z";
  data.sections[0].citations = ["missing-source"];
  assert.throws(
    () => validateData(data),
    (error) => {
      assert.equal(error.name, "DataValidationError");
      assert.ok(error.issues.some((issue) => issue.path === "questions[1].answer"));
      assert.ok(error.issues.some((issue) => issue.path === "sections[0].citations[0]"));
      return true;
    }
  );
});

test("schema validations reject duplicate IDs, bad URLs, and bad highlights", () => {
  const data = validInput({
    metadata: {
      title: "A",
      sourceTitle: "",
      sourceUrl: "",
      factCheckMode: "cited verification",
      generatedAt: "2026-06-07",
      outputName: "",
      htmlFileName: "a.html",
      jsonFileName: "a.json"
    }
  });
  data.sections.push({...data.sections[0]});
  data.citations[0].url = "file:///private";
  data.highlights = [{color: "blue", scopeId: "missing", start: 4, end: 2}];

  assert.throws(
    () => validateData(data),
    (error) => {
      assert.ok(error.issues.some((issue) => issue.path === "sections[1].id"));
      assert.ok(error.issues.some((issue) => issue.path === "citations[0].url"));
      assert.ok(error.issues.some((issue) => issue.path === "highlights[0].color"));
      assert.ok(error.issues.some((issue) => issue.path === "highlights[0].scopeId"));
      assert.ok(error.issues.some((issue) => issue.path === "highlights[0].end"));
      return true;
    }
  );
});

test("template validation checks placeholders and product hooks", () => {
  assert.throws(
    () => validateTemplate("<html></html>"),
    (error) => {
      assert.equal(error.name, "TemplateContractError");
      assert.ok(error.issues.some((issue) => issue.path === "__NOTION_NOTES_TITLE__"));
      assert.ok(error.issues.some((issue) => issue.path === "template#notes-root"));
      return true;
    }
  );
});

test("exit code mapping is stable", () => {
  assert.equal(runCli(["node", "script"]), 2);
  assert.equal(exitCodeForError(new DataValidationError([])), 65);
  assert.equal(exitCodeForError(new FileSystemRenderError("x")), 74);
});

test("sample render preserves product contract and avoids visible Notion source URLs", () => {
  const dir = tempDir();
  const result = renderPage(sampleJsonPath, path.join(dir, "Notes"), {
    generatedAt: "2026-06-07"
  });
  const html = fs.readFileSync(result.outputPath, "utf8");
  const normalizedJson = fs.readFileSync(result.jsonPath, "utf8");
  const template = fs.readFileSync(templatePath, "utf8");
  const embedded = extractEmbeddedData(html);

  assert.equal(result.slug, "2605_25_31");
  assert.equal(embedded.metadata.sourceUrl, "");
  assert.ok(embedded.citations.some((source) => source.id === "src-pyproject"));
  assert.ok(embedded.sections.some((section) => section.citations.includes("src-pyproject")));
  assert.doesNotMatch(html, /Original Notion page/i);
  assert.doesNotMatch(html, /notion\.site|notion\.so/i);
  assert.doesNotMatch(normalizedJson, /notion\.site|notion\.so/i);
  assert.match(html, /id="toc"/);
  assert.match(html, /id="selection-toolbar"/);
  assert.match(html, /id="highlights-panel"/);
  assert.match(html, /id="json-connect-panel"/);
  assert.match(html, /Show Answer/);
  assert.match(template, /renderSources/);
  assert.match(template, /id="sources"/);
  assert.match(template, /source-\$\{escapeHtml\(source\.id\)\}/);
});
