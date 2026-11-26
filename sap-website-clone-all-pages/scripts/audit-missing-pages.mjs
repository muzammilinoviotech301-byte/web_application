import fs from "node:fs";
import path from "node:path";

// Lists pages the clone links to but doesn't have, so they can be captured.
//
// Usage: node scripts/audit-missing-pages.mjs [outDir]
// Writes missing-internal.txt (local links that 404) and missing-sapcom.txt
// (links that leave for sap.com because no local page exists), each sorted by
// how many local pages link there.

const root = process.cwd();
const outDir = path.resolve(process.argv[2] || root);
const manifest = JSON.parse(fs.readFileSync(path.join(root, "content/manifest.json"), "utf8"));
const keys = new Set(Object.keys(manifest));
const appRoutes = new Set(
  fs.readdirSync(path.join(root, "src/app"), { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("[") && !d.name.includes("."))
    .map((d) => d.name)
);
const REWRITES = new Set(["products"]); // next.config.ts rewrites
const ASSET_PREFIX = /^\/(captured|assets|reference|_next|etc\.clientlibs|dam|content)\//;

const missing = new Map();
const toSapCom = new Map();
const add = (map, key, source) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(source);
};

function check(rawHref, source) {
  const href = rawHref.replace(/&amp;/g, "&").split("#")[0].split("?")[0];
  const sap = href.match(/^https?:\/\/(?:www\.)?sap\.com(\/[^"]*)?$/);
  if (sap) {
    add(toSapCom, (sap[1] || "/").replace(/\.html$/, "").replace(/\/$/, "") || "/", source);
    return;
  }
  if (!href.startsWith("/") || href.startsWith("//") || ASSET_PREFIX.test(href)) return;
  const clean = href.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  const key = clean === "/" ? "index" : clean.slice(1);
  if (keys.has(key) || REWRITES.has(key) || appRoutes.has(key.split("/")[0])) return;
  add(missing, key, source);
}

for (const key of keys) {
  const body = fs.readFileSync(path.join(root, "content/pages", `${key}.html`), "utf8");
  for (const m of body.matchAll(/href="([^"]+)"/g)) check(m[1], key);
}
for (const file of ["src/data/masthead-menu.ts", "src/data/site-footer.ts"]) {
  const text = fs.readFileSync(path.join(root, file), "utf8").replace(/\\"/g, '"');
  for (const m of text.matchAll(/(?:href|titleHref)"?\s*[:=]\s*"([^"]+)"/g)) check(m[1], file);
}

const sorted = (map) => [...map].sort((a, b) => b[1].size - a[1].size);
fs.writeFileSync(
  path.join(outDir, "missing-internal.txt"),
  sorted(missing).map(([k, s]) => `${s.size}\t/${k}`).join("\n") + "\n"
);
fs.writeFileSync(
  path.join(outDir, "missing-sapcom.txt"),
  sorted(toSapCom).map(([k, s]) => `${s.size}\t${k}`).join("\n") + "\n"
);

const groups = {};
for (const [k] of missing) groups[k.split("/")[0]] = (groups[k.split("/")[0]] || 0) + 1;
console.log(`local pages: ${keys.size}`);
console.log(`missing local pages (links that 404): ${missing.size}`);
console.log(`pages only reachable on sap.com: ${toSapCom.size}`);
console.log("top missing:", sorted(missing).slice(0, 20).map(([k, s]) => `${s.size} /${k}`).join(" | "));
console.log("by section:", Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 20).map((e) => e.join(":")).join(" "));
