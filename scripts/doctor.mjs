#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const checks = [];

function addCheck(name, passed, detail = "") {
  checks.push({name, passed, detail});
}

function commandVersion(command, args = ["--version"]) {
  const result = spawnSync(command, args, {cwd: repoRoot, encoding: "utf8"});
  if (result.status !== 0) {
    return null;
  }
  return String(result.stdout || result.stderr).trim();
}

const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
addCheck("Node 20+", nodeMajor >= 20, `found ${process.version}`);

const npmVersion = commandVersion("npm");
addCheck("npm available", Boolean(npmVersion), npmVersion || "npm was not found on PATH");

const requiredPaths = [
  ".agents/skills/notion-notes/SKILL.md",
  ".agents/skills/notion-notes/agents/openai.yaml",
  ".agents/skills/notion-notes/assets/html-template/template.html",
  ".agents/skills/notion-notes/src/render_notion_notes_page.ts",
  ".agents/skills/notion-notes/scripts/render_notion_notes_page.js",
  ".agents/skills/notion-notes/references/fact-checking.md",
  ".agents/skills/notion-notes/references/note-quality-rubric.md",
  ".agents/skills/notion-notes/references/question-design.md",
  "package-lock.json"
];

for (const relativePath of requiredPaths) {
  addCheck(`bundle path ${relativePath}`, fs.existsSync(path.join(repoRoot, relativePath)));
}

const dependencyBins = ["tsx", "tsc", "eslint", "playwright"];
for (const bin of dependencyBins) {
  const binPath = path.join(repoRoot, "node_modules", ".bin", process.platform === "win32" ? `${bin}.cmd` : bin);
  addCheck(`dependency ${bin}`, fs.existsSync(binPath), fs.existsSync(binPath) ? binPath : "run npm install");
}

const jsCli = path.join(repoRoot, ".agents/skills/notion-notes/scripts/render_notion_notes_page.js");
if (fs.existsSync(jsCli)) {
  const syntax = spawnSync(process.execPath, ["--check", jsCli], {cwd: repoRoot, encoding: "utf8"});
  addCheck("renderer JS syntax", syntax.status === 0, syntax.stderr.trim());
}

const privacy = spawnSync(process.execPath, ["scripts/privacy_scan.mjs"], {
  cwd: repoRoot,
  encoding: "utf8"
});
addCheck("privacy scan", privacy.status === 0, privacy.status === 0 ? privacy.stdout.trim() : privacy.stderr.trim());

let failed = 0;
for (const check of checks) {
  const status = check.passed ? "ok" : "fail";
  console.log(`${status} - ${check.name}${check.detail ? ` (${check.detail})` : ""}`);
  if (!check.passed) {
    failed += 1;
  }
}

if (failed) {
  console.error(`doctor failed ${failed} check(s).`);
  process.exit(1);
}

console.log("doctor passed.");
