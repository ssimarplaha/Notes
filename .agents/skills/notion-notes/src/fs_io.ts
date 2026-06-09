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

import {FileSystemRenderError} from "./errors";

/** Reads a UTF-8 text file and maps host errors to stable renderer errors. */
export function readUtf8(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    throw new FileSystemRenderError(`Could not read ${filePath}.`, error);
  }
}

/** Reads JSON as unknown data; schema trust is established later. */
export function readJsonUnknown(filePath: string): unknown {
  const raw = readUtf8(filePath);
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new FileSystemRenderError(`Could not parse JSON from ${filePath}.`, error);
  }
}

/** Creates a directory tree before atomic output writes. */
export function ensureDirectory(dirPath: string): void {
  try {
    fs.mkdirSync(dirPath, {recursive: true});
  } catch (error) {
    throw new FileSystemRenderError(`Could not create directory ${dirPath}.`, error);
  }
}

/** Writes a UTF-8 file through fsync and rename to avoid partial final files. */
export function atomicWriteUtf8(filePath: string, content: string): void {
  const directory = path.dirname(filePath);
  const baseName = path.basename(filePath);
  const tempPath = path.join(
    directory,
    `.${baseName}.${process.pid}.${Date.now()}.tmp`
  );
  let fd: number | null = null;

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
        /* The original write failure is more useful than close cleanup. */
      }
    }
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch {
      /* Best-effort cleanup keeps the stable write error intact. */
    }
    throw new FileSystemRenderError(`Could not write ${filePath}.`, error);
  }
}
