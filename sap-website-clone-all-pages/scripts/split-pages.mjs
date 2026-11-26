import fs from "node:fs";
import path from "node:path";
import { writePages, manifestFile, pagesDir } from "./lib/page-store.mjs";

// One-time migration: splits the legacy src/data/pages.json bundle into the
// per-page store under content/. Safe to re-run; existing entries are overwritten.
//
// Usage: node scripts/split-pages.mjs [path/to/pages.json]

const legacyFile = path.resolve(process.cwd(), process.argv[2] || "src/data/pages.json");
if (!fs.existsSync(legacyFile)) {
  console.error(`Legacy pages file not found: ${legacyFile}`);
  process.exit(1);
}

const legacy = JSON.parse(fs.readFileSync(legacyFile, "utf8"));
const pages = Object.fromEntries(
  Object.entries(legacy).map(([file, page]) => [file.replace(/\.html$/i, ""), page])
);

const manifest = writePages(pages);
console.log(`Wrote ${Object.keys(pages).length} page bodies to ${pagesDir}`);
console.log(`Manifest now lists ${Object.keys(manifest).length} pages: ${manifestFile}`);
