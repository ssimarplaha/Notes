#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const defaultRoots = ["README.md", "AGENTS.md", "docs", "Notes", ".agents/skills/notion-notes"];
const textExtensions = new Set([
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".yaml",
  ".yml"
]);
const excludedDirs = new Set([".git", "node_modules", "dist", "playwright-report", "test-results"]);
const patterns = [
  {
    name: "private Notion URL",
    pattern: /https?:\/\/(?:www\.)?(?:notion\.site|notion\.so)\/[^\s"'<>]+/gi
  },
  {
    name: "OpenAI-style API key",
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g
  },
  {
    name: "GitHub token",
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/g
  },
  {
    name: "Slack token",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g
  },
  {
    name: "AWS access key",
    pattern: /\bAKIA[0-9A-Z]{16}\b/g
  },
  {
    name: "assigned secret-like value",
    pattern: /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|secret)\b\s*[:=]\s*["'][^"'\n]{8,}["']/gi
  }
];

function listFiles(target) {
  const absolute = path.resolve(repoRoot, target);
  if (!fs.existsSync(absolute)) {
    return [];
  }
  const stat = fs.statSync(absolute);
  if (stat.isFile()) {
    return shouldScanFile(absolute) ? [absolute] : [];
  }
  if (!stat.isDirectory()) {
    return [];
  }

  const files = [];
  const entries = fs.readdirSync(absolute, {withFileTypes: true});
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".agents") {
      continue;
    }
    if (entry.isDirectory() && excludedDirs.has(entry.name)) {
      continue;
    }
    const child = path.join(absolute, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(path.relative(repoRoot, child)));
    } else if (entry.isFile() && shouldScanFile(child)) {
      files.push(child);
    }
  }
  return files;
}

function shouldScanFile(filePath) {
  return textExtensions.has(path.extname(filePath));
}

function lineAndColumn(content, index) {
  const before = content.slice(0, index);
  const lines = before.split(/\r?\n/);
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

const targets = process.argv.slice(2).length ? process.argv.slice(2) : defaultRoots;
const files = Array.from(new Set(targets.flatMap(listFiles))).sort();
const findings = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  for (const check of patterns) {
    check.pattern.lastIndex = 0;
    for (const match of content.matchAll(check.pattern)) {
      const location = lineAndColumn(content, match.index || 0);
      findings.push({
        file: path.relative(repoRoot, file),
        line: location.line,
        column: location.column,
        name: check.name
      });
    }
  }
}

if (findings.length) {
  console.error("Privacy scan failed:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line}:${finding.column} ${finding.name}`);
  }
  process.exit(1);
}

console.log(`Privacy scan passed for ${files.length} file(s).`);
