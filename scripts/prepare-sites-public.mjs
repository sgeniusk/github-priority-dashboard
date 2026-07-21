import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".sites-public");

const files = [
  "dashboard.html",
  "dashboard.css",
  "report.html",
  "project-report.html",
  "monthly-analysis.html",
  "favicon.svg",
  "projects.json",
  "suggestions.json",
  "usage.json",
  "codex-summary.json",
  "history.json",
  "activity.json",
  "reports.json",
  "news.json",
  "project-logs.json",
  "monthly-analysis.json",
  "docs/project-session-prompts.md",
  "scripts/dashboard.js",
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const relativePath of files) {
  const destination = path.join(output, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(root, relativePath), destination);
}

await cp(path.join(root, "assets"), path.join(output, "assets"), {
  recursive: true,
});
await cp(path.join(root, "project-pages"), path.join(output, "project-pages"), {
  recursive: true,
});

console.log(`Sites 정적 자산 준비 완료 — ${files.length}개 파일 + 2개 디렉터리`);
