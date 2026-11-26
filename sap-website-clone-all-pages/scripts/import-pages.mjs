import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readManifest, writePages, pagesDir } from "./lib/page-store.mjs";

// Usage:
//   npm run import:pages                       -> reads ./saved-pages
//   npm run import:pages -- path/to/folder     -> reads a custom folder
//
// Supported input: Chrome "Webpage, Complete" saves (.html + _files folder)
// or plain .html files with relative assets.

const inputDir = path.resolve(process.cwd(), process.argv[2] || "saved-pages");
const catalogFile = path.resolve(process.cwd(), "src/data/page-catalog.ts");
const assetsDir = path.resolve(process.cwd(), "public/assets");
const capturedStylesDir = path.resolve(process.cwd(), "public/captured/styles");

if (!fs.existsSync(inputDir)) {
  console.error(`Input folder not found: ${inputDir}`);
  process.exit(1);
}

fs.mkdirSync(assetsDir, { recursive: true });
fs.mkdirSync(capturedStylesDir, { recursive: true });

const imported = {};
const copiedAssets = new Set();
const writtenStyles = new Set();
const existingIndexPage = readManifest().index;

const DATA_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/x-icon": "ico",
  "font/woff": "woff",
  "font/woff2": "woff2",
  "application/font-woff": "woff",
  "application/font-woff2": "woff2",
};

function decodeEntities(value) {
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'");
}

function stripTags(value) {
  return String(value).replace(/<[^>]+>/g, "");
}

function normalizePathname(value) {
  const pathname = String(value).split(/[?#]/)[0];
  const segments = [];
  for (const segment of pathname.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      segments.pop();
      continue;
    }
    segments.push(decodeURIComponent(segment));
  }
  const out = "/" + segments.join("/");
  if (out === "/" || segments.at(-1) === "index" || out === "/index") return "/";
  return out.replace(/\.html?$/i, "");
}

function copyAsset(localPath) {
  const buffer = fs.readFileSync(localPath);
  const ext = path.extname(localPath);
  const base = path.basename(localPath);
  const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 8);

  let name = base;
  let target = path.join(assetsDir, name);
  if (fs.existsSync(target) && !fs.readFileSync(target).equals(buffer)) {
    const stem = base.slice(0, base.length - ext.length);
    name = `${stem}-${hash}${ext}`;
    target = path.join(assetsDir, name);
  }
  if (!fs.existsSync(target)) fs.copyFileSync(localPath, target);
  copiedAssets.add(name);
  return `/assets/${name}`;
}

function externalizeStyles(html) {
  return String(html).replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_match, css) => {
    const content = String(css).trim();
    if (!content) return "";
    const hash = crypto.createHash("sha1").update(content).digest("hex").slice(0, 16);
    const file = path.join(capturedStylesDir, `${hash}.css`);
    if (!fs.existsSync(file)) fs.writeFileSync(file, content, "utf8");
    writtenStyles.add(hash);
    return `<link rel="stylesheet" href="/captured/styles/${hash}.css">`;
  });
}

function externalizeDataUrls(html) {
  return String(html).replace(
    /\b(src|href)\s*=\s*(["'])(data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,)([A-Za-z0-9+/=]+)\2/gi,
    (match, attr, quote, _prefix, mime, base64) => {
      const ext = DATA_EXTENSIONS[String(mime).toLowerCase()] || "bin";
      const buffer = Buffer.from(base64, "base64");
      const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 16);
      const name = `${hash}.${ext}`;
      const target = path.join(assetsDir, name);
      if (!fs.existsSync(target)) fs.writeFileSync(target, buffer);
      copiedAssets.add(name);
      return `${attr}=${quote}/assets/${name}${quote}`;
    }
  );
}

function rewriteUrl(value, pageDir) {
  const raw = String(value).trim();
  if (!raw || /^(#|mailto:|tel:|javascript:|data:)/i.test(raw)) return raw;

  if (/^(https?:)?\/\//i.test(raw)) {
    try {
      const url = new URL(raw.startsWith("//") ? `https:${raw}` : raw);
      if (/sap\.com$/i.test(url.hostname)) return normalizePathname(url.pathname + url.search);
      return raw;
    } catch {
      return raw;
    }
  }

  const withoutQuery = raw.split(/[?#]/)[0];
  const isAsset =
    /^(assets|_files|images|img|media)\//i.test(withoutQuery) ||
    /\.(png|jpe?g|webp|gif|svg|avif|woff2?|ttf|otf|eot|ico|mp4|webm|pdf)$/i.test(withoutQuery);

  if (isAsset) {
    const local = path.resolve(pageDir, withoutQuery);
    if (fs.existsSync(local) && fs.statSync(local).isFile()) return copyAsset(local);
  }

  return normalizePathname(raw);
}

function rewriteAttributes(html, pageDir) {
  return html.replace(/\b(src|href|srcset)\s*=\s*(["'])([\s\S]*?)\2/gi, (_match, name, _quote, value) => {
    if (name.toLowerCase() === "srcset") {
      const parts = String(value)
        .split(",")
        .map((entry) => {
          const [url, ...descriptor] = entry.trim().split(/\s+/);
          return `${rewriteUrl(url, pageDir)}${descriptor.length ? ` ${descriptor.join(" ")}` : ""}`;
        })
        .join(", ");
      return `${name}="${parts}"`;
    }
    return `${name}="${rewriteUrl(value, pageDir)}"`;
  });
}

function cleanBody(html) {
  // Keep <style> blocks: captured SAP pages may need their own CSS classes.
  // Scripts, inline handlers, and the shared shell are removed by design.
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<(header|footer|nav)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(["']).*?\1/gis, "");
}

function extractBody(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (main) return main[1];
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return body ? body[1] : html;
}

function extractTitle(html, fallback) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = decodeEntities(stripTags(match?.[1] || "")).replace(/\s+/g, " ").trim();
  return title || fallback;
}

function extractDescription(html, fallback) {
  const meta =
    html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
    html.match(/<meta\b[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i);
  const description = decodeEntities(stripTags(meta?.[1] || "")).replace(/\s+/g, " ").trim();
  return description || fallback;
}

function slugFromFile(file) {
  let relative = path.relative(inputDir, file).replace(/\\/g, "/");
  relative = relative.replace(/\.html?$/i, "").replace(/(^|\/)index$/i, "$1");
  const slug = relative
    .split("/")
    .map((segment) =>
      segment
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
    .filter(Boolean)
    .join("/");
  return slug || "index";
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_files" || entry.name === "node_modules") continue;
      walk(full, files);
    } else if (/\.html?$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(inputDir);

for (const file of files) {
  const slug = slugFromFile(file);
  const html = fs.readFileSync(file, "utf8");
  const pageDir = path.dirname(file);
  const fallback = slug === "index" ? "SAP" : slug.split("/").at(-1).replace(/-/g, " ");

  const cleaned = cleanBody(extractBody(html));
  const body = rewriteAttributes(
    externalizeDataUrls(externalizeStyles(cleaned)),
    pageDir
  ).trim();
  if (!body) continue;

  imported[slug] = {
    title: slug === "index" && existingIndexPage ? existingIndexPage.title : extractTitle(html, fallback),
    description:
      slug === "index" && existingIndexPage
        ? existingIndexPage.description
        : extractDescription(html, `Local copy of ${fallback}.`),
    body,
  };
}

const merged = writePages(imported);

const catalogItems = Object.entries(merged)
  .map(([slug, page]) => {
    const href = slug === "index" ? "/" : `/${slug}`;
    const title = String(page?.title || "")
      .replace(/\s+/g, " ")
      .trim();
    const label =
      title
        .replace(/\s*[|–—-]\s*SAP\b.*$/i, "")
        .replace(/\s*\|\s*$/, "")
        .slice(0, 90) || href;
    const description = String(page?.description || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
    return [label, href, description];
  })
  .sort((a, b) => a[1].localeCompare(b[1]));

const catalogSource = `// Generated by scripts/import-pages.mjs. Do not edit by hand.
export type PageCatalogItem = [label: string, href: string, description: string];

export const PAGE_CATALOG: PageCatalogItem[] = [
${catalogItems
  .map(
    ([label, href, description]) =>
      `  [${JSON.stringify(label)}, ${JSON.stringify(href)}, ${JSON.stringify(description)}],`
  )
  .join("\n")}
];
`;
fs.writeFileSync(catalogFile, catalogSource, "utf8");

console.log(`Imported ${Object.keys(imported).length} page(s) from ${inputDir}`);
console.log(`Copied ${copiedAssets.size} new/referenced asset(s) to public/assets`);
console.log(`Wrote ${writtenStyles.size} unique captured stylesheet(s) to public/captured/styles`);
console.log(`Store now holds ${Object.keys(merged).length} total pages in ${pagesDir}`);
console.log(`Wrote ${catalogItems.length} searchable catalog entries to ${catalogFile}`);
if (Object.keys(imported).length) {
  console.log("Imported slugs:");
  for (const key of Object.keys(imported)) console.log(`  - ${key}`);
}
