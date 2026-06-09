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

/** POSIX-style exit code used for command-line usage mistakes. */
export const USAGE_EXIT_CODE = 2;

/** POSIX-style exit code used for data or template validation failures. */
export const VALIDATION_EXIT_CODE = 65;

/** POSIX-style exit code used for filesystem and JSON read/write failures. */
export const FILESYSTEM_EXIT_CODE = 74;

/** One validation failure with a machine-readable path and readable message. */
export interface ValidationIssue {
  path: string;
  message: string;
}

/** Error thrown when CLI arguments cannot be parsed. */
export class UsageError extends Error {
  readonly exitCode = USAGE_EXIT_CODE;

  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

/** Error thrown when notes JSON fails the production data contract. */
export class DataValidationError extends Error {
  readonly exitCode = VALIDATION_EXIT_CODE;
  readonly issues: readonly ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super(`Validation failed with ${issues.length} issue(s).`);
    this.name = "DataValidationError";
    this.issues = issues;
  }
}

/** Error thrown when the standalone HTML template contract is broken. */
export class TemplateContractError extends Error {
  readonly exitCode = VALIDATION_EXIT_CODE;
  readonly issues: readonly ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super(`Template contract failed with ${issues.length} issue(s).`);
    this.name = "TemplateContractError";
    this.issues = issues;
  }
}

/** Error thrown for filesystem access, unreadable JSON, or write failures. */
export class FileSystemRenderError extends Error {
  readonly exitCode = FILESYSTEM_EXIT_CODE;
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "FileSystemRenderError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/** Maps renderer errors to the stable CLI exit code contract. */
export function exitCodeForError(error: unknown): number {
  if (error instanceof UsageError ||
      error instanceof DataValidationError ||
      error instanceof TemplateContractError ||
      error instanceof FileSystemRenderError) {
    return error.exitCode;
  }
  return FILESYSTEM_EXIT_CODE;
}

/** Formats renderer errors without unstable stack traces or host details. */
export function formatError(error: unknown): string {
  if (error instanceof DataValidationError ||
      error instanceof TemplateContractError) {
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
