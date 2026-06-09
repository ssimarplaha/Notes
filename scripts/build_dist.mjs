#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
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
const next = content.replace(
  /Source fingerprint: [a-f0-9]{64}/,
  `Source fingerprint: ${sourceFingerprint()}`
);

if (next === content) {
  console.log("Generated renderer fingerprint already current.");
} else {
  fs.writeFileSync(jsCli, next, "utf8");
  console.log("Updated generated renderer fingerprint.");
}
