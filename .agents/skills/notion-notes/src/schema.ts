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

/** Metadata embedded into the standalone notes page. */
export interface Metadata {
  title: string;
  sourceTitle: string;
  sourceUrl: string;
  factCheckMode: string;
  generatedAt: string;
  outputName: string;
  htmlFileName: string;
  jsonFileName: string;
}

/** A rendered source citation that is linked from sections and Sources. */
export interface Citation {
  id: string;
  label: string;
  url: string;
  note?: string;
}

/** A boxed example or explanatory note in the reading content. */
export interface Callout {
  title?: string;
  body?: string;
  code?: string;
}

/** A command or code snippet attached to a section. */
export interface Command {
  title?: string;
  body?: string;
  code?: string;
}

/** A major technical-blog section in the generated study page. */
export interface Section {
  id: string;
  title: string;
  items: string[];
  examples?: Callout[];
  commands?: Command[];
  mistakes?: string[];
  citations?: string[];
}

/** A saved text-selection highlight restored by the browser-side template. */
export interface Highlight {
  id?: string;
  color: "green" | "yellow" | "red";
  text?: string;
  scopeId?: string;
  sectionTitle?: string;
  start?: number;
  end?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Common fields shared by every end-of-chapter test question. */
export interface BaseQuestion {
  id: string;
  testType: "tf" | "mcq" | "completion" | "written";
  sectionId?: string;
  source?: string;
  question: string;
}

/** A true/false question. */
export interface TrueFalseQuestion extends BaseQuestion {
  testType: "tf";
  answer: boolean | "true" | "false";
}

/** A multiple-choice question with keyed options. */
export interface McqQuestion extends BaseQuestion {
  testType: "mcq";
  options: Record<string, string>;
  answer: string;
}

/** A short completion question with one or more accepted answers. */
export interface CompletionQuestion extends BaseQuestion {
  testType: "completion";
  answerText?: string;
  acceptedAnswers?: string[];
}

/** A written or calculation-style question with a model answer. */
export interface WrittenQuestion extends BaseQuestion {
  testType: "written";
  modelAnswerText: string;
  keywords?: string[];
}

/** All supported question records. */
export type Question =
  TrueFalseQuestion | McqQuestion | CompletionQuestion | WrittenQuestion;

/** Fully normalized and validated notes data ready for template embedding. */
export interface NotesData {
  metadata: Metadata;
  summary: string[];
  sections: Section[];
  quickReview: string[];
  citations: Citation[];
  questions: Question[];
  highlights: Highlight[];
}

/** Rendering mode and output paths resolved before validation and writes. */
export interface RenderPlan {
  mode: "directory" | "explicit";
  slug: string;
  outputPath: string;
  jsonPath: string | null;
  outputDir: string;
}

/** Stable machine-readable result printed by the CLI on success. */
export interface RenderResult {
  mode: "directory" | "explicit";
  slug: string;
  outputPath: string;
  jsonPath: string | null;
  sections: number;
  citations: number;
  questions: number;
  highlights: number;
  jsonFileName: string;
}

/** Test-only renderer options for deterministic clocks and fixtures. */
export interface RenderOptions {
  generatedAt?: string;
  templatePath?: string;
}
