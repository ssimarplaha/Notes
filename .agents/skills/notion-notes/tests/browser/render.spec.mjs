"use strict";

import {expect, test} from "@playwright/test";
import fs from "node:fs";
import http from "node:http";
import {createRequire} from "node:module";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../../..");
const sampleJsonPath = path.join(repoRoot, "Notes", "2605_25_31", "2605_25_31.json");
const require = createRequire(import.meta.url);
const {renderPage} = require(path.join(repoRoot, ".agents", "skills", "notion-notes", "scripts", "render_notion_notes_page.js"));

let server;
let baseUrl;
let outputDir;

test.beforeAll(async () => {
  outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "notion-notes-browser-"));
  const result = renderPage(sampleJsonPath, outputDir, {
    generatedAt: "2026-06-07"
  });
  const root = path.dirname(result.outputPath);
  server = http.createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const requested = path.normalize(url.pathname.replace(/^\/+/, ""));
    const filePath = path.join(root, requested || path.basename(result.outputPath));
    if (!filePath.startsWith(root) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "content-type": filePath.endsWith(".json") ? "application/json" : "text/html"
    });
    response.end(fs.readFileSync(filePath));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}/${path.basename(result.outputPath)}`;
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("desktop and mobile layouts avoid horizontal overflow", async ({page}) => {
  await page.setViewportSize({width: 1280, height: 900});
  await page.goto(baseUrl);
  await expect(page.locator("#toc")).toBeVisible();
  await expect(page.locator("#selection-toolbar")).toBeHidden();
  await expect(page.locator(".answer-toggle").first()).toHaveText("Show Answer");
  await expect(page.locator("#highlights-panel")).toHaveAttribute("aria-hidden", "true");
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);

  await page.setViewportSize({width: 390, height: 844});
  overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
});

test("toc links, answer reveals, highlight toolbar, and panel controls work", async ({page}) => {
  await page.goto(baseUrl);
  await page.locator('#toc a[href="#test-section"]').click();
  await expect(page.locator("#test-section")).toBeInViewport();

  const firstToggle = page.locator(".answer-toggle").first();
  await firstToggle.click();
  await expect(firstToggle).toHaveText("Hide Answer");
  await page.locator("#reveal-answers").click();
  await expect(page.locator("#reveal-answers")).toHaveText("Hide all answers");

  await page.locator('#toc a[href="#summary"]').click();
  await page.evaluate(() => {
    const target = document.querySelector('[data-highlight-scope="summary"] li');
    const range = document.createRange();
    range.selectNodeContents(target);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
  await expect(page.locator("#selection-toolbar")).toBeVisible();
  await page.locator('[data-highlight-action="green"]').click();

  await page.locator("#highlights-tab").click();
  await expect(page.locator("#highlights-panel")).toHaveAttribute("aria-hidden", "false");
  await expect(page.locator(".highlight-group h3").first()).toContainText("Green");
  await page.locator("#highlights-close").click();
  await expect(page.locator("#highlights-panel")).toHaveAttribute("aria-hidden", "true");
});
