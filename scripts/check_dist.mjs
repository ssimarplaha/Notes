#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, ".agents/skills/notion-notes/src");
const jsCli = path.join(repoRoot, ".agents/skills/notion-notes/scripts/render_notion_notes_page.js");

function sourceFingerprint() {
  const files = fs.readdirSync(sourceDir)
    .filter((name) => name.endsWith(".ts"))
    .sort();
  const hash = createHash("sha256");
  for (const file of files) {
    const relativePath = `.agents/skills/notion-notes/src/${file}`;
    hash.update(relativePath);
    hash.update("\0");
    hash.update(fs.readFileSync(path.join(sourceDir, file)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

if (!fs.existsSync(jsCli)) {
  console.error(`Missing generated renderer: ${path.relative(repoRoot, jsCli)}`);
  process.exit(1);
}

const content = fs.readFileSync(jsCli, "utf8");
const match = content.match(/Source fingerprint: ([a-f0-9]{64})/);
const expected = sourceFingerprint();

if (!match) {
  console.error("Generated renderer is missing a Source fingerprint header.");
  process.exit(1);
}

if (match[1] !== expected) {
  console.error("Generated renderer is stale.");
  console.error(`Expected fingerprint: ${expected}`);
  console.error(`Found fingerprint:    ${match[1]}`);
  console.error("Run npm run build:dist after changing TypeScript renderer source.");
  process.exit(1);
}

const syntax = spawnSync(process.execPath, ["--check", jsCli], {cwd: repoRoot, encoding: "utf8"});
if (syntax.status !== 0) {
  console.error(syntax.stderr.trim());
  process.exit(syntax.status || 1);
}

console.log("Generated renderer is current.");
