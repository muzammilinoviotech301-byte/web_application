import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { writePages, readManifest } from "./lib/page-store.mjs";
import { scopeCss, unscopeCss } from "./lib/css-scope.mjs";

const root = process.cwd();
const styleDir = path.join(root, "public/captured/styles/live");
fs.mkdirSync(styleDir, { recursive: true });
const SITE = "https://www.sap.com";
// SVG <use href> is blocked cross-origin, so the shared icon sprite is served
// from public/ instead of sap.com. The file is a verbatim live capture.
const LOCAL_SVG_SPRITE =
  "/etc.clientlibs/sapdx/front-layer/dist/resources/assets/images/SapIconsSprite.svg";

function readCaptures(file) {
  const text = fs.readFileSync(file, "utf8");
  // Saved tool output wraps the payload in one or more layers of JSON string
  // escaping. Take the text between the markers and unescape it until it is
  // a plain JSON object.
  const out = [];
  for (const m of text.matchAll(/LIVECAPTURE_START([\s\S]*?)LIVECAPTURE_END/g)) {
    let payload = m[1];
    for (let i = 0; i < 5 && !payload.startsWith('{"'); i += 1) payload = JSON.parse(`"${payload}"`);
    out.push(JSON.parse(payload));
  }
  return out;
}

// CSS url(...) references: keep local copies where they exist, else load from sap.com.
function fixCssUrls(css, sheetUrl) {
  return css.replace(/url\((['"]?)([^'")]+)\1\)/g, (whole, q, ref) => {
    if (/^(data:|https?:|#)/.test(ref)) return whole;
    const abs = new URL(ref, sheetUrl);
    if (abs.origin !== SITE) return `url(${q}${abs.href}${q})`;
    const local = path.join(root, "public", decodeURIComponent(abs.pathname));
    return fs.existsSync(local) ? `url(${q}${abs.pathname}${q})` : `url(${q}${abs.href}${q})`;
  });
}

function saveCss(name, text, sheetUrl) {
  const safe = name.replace(/[^\w.-]/g, "_");
  const file = path.join(styleDir, safe);
  if (!fs.existsSync(file)) fs.writeFileSync(file, scopeCss(fixCssUrls(text, sheetUrl)), "utf8");
  return `/captured/styles/live/${safe}`;
}

// Resolve image/media URLs against the live page URL. Edge Delivery pages use
// page-relative "./media_*.jpeg" sources, which mean nothing on localhost.
// Root-relative sources stay local only when the file exists under public/.
function absolutizeMedia(html, pageUrl) {
  const resolve = (ref) => {
    const r = ref.trim();
    if (!r || /^(data:|blob:|https?:|#)/i.test(r)) return r;
    if (r.startsWith("/") && !r.startsWith("//")) {
      const local = path.join(root, "public", decodeURIComponent(r.split(/[?#]/)[0]));
      if (fs.existsSync(local)) return r;
    }
    try {
      return new URL(r, pageUrl).href;
    } catch {
      return r;
    }
  };
  return html
    .replace(/\s(src|poster|data-src)="([^"]*)"/g, (whole, a, v) => ` ${a}="${resolve(v.replace(/&amp;/g, "&")).replace(/&/g, "&amp;")}"`)
    .replace(/\s(srcset|data-srcset)="([^"]*)"/g, (whole, a, v) =>
      ` ${a}="${v.split(",").map((part) => {
        const [u, ...rest] = part.trim().split(/\s+/);
        return [resolve(u.replace(/&amp;/g, "&")).replace(/&/g, "&amp;"), ...rest].join(" ");
      }).join(", ")}"`)
    .replace(/url\((['"]?)(\.{0,2}\/?media_[^'")]+)\1\)/g, (whole, q, u) => `url(${q}${resolve(u)}${q})`);
}

function localizeBody(html, keys) {
  return html
    // Drop analytics/noise attributes and comments.
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s(data-activity-map-[a-z-]+|data-analytics-[a-z-]+)="[^"]*"/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    // Site links: absolute sap.com or root-relative .html -> local route when we have it.
    .replace(/href="(?:https:\/\/www\.sap\.com)?(\/[^"#?]*?)(?:\.html)?([?#][^"]*)?"/g, (whole, p, suffix = "") => {
      if (p === LOCAL_SVG_SPRITE) return `href="${p}${suffix}"`;
      if (/^\/(dam|etc\.clientlibs|bin|content)\//.test(p)) return `href="${SITE}${p}${suffix}"`;
      const key = p.replace(/^\/|\/$/g, "").replace(/\/index$/, "") || "index";
      if (keys.has(key) || key.startsWith("mena")) return `href="/${key === "index" ? "" : key}${suffix}"`;
      return `href="/${key}${suffix}"`;
    })
    // Images and media served by sap.com stay on sap.com.
    .replace(/(src|srcset|poster)="\/(dam|etc\.clientlibs|content)\//g, `$1="${SITE}/$2/`)
    .replace(/(srcset="[^"]*)/g, (s) => s.replace(/(^|, ?)\/(dam|content)\//g, `$1${SITE}/$2/`));
}

// `--rescope` re-applies scopeCss to stylesheets saved before scoping existed.
// Shadow-DOM sheets (shadow-*.css) are never scoped: inside a shadow root
// there is no .captured-body ancestor, so scoping would disable every rule.
// Any that an earlier version scoped by mistake are restored here.
if (process.argv[2] === "--rescope") {
  let n = 0;
  for (const name of fs.readdirSync(styleDir)) {
    const file = path.join(styleDir, name);
    const css = fs.readFileSync(file, "utf8");
    if (name.startsWith("shadow-")) {
      const restored = unscopeCss(css);
      if (restored !== css) {
        fs.writeFileSync(file, restored, "utf8");
        n += 1;
      }
      continue;
    }
    const scoped = scopeCss(css);
    if (scoped !== css) {
      fs.writeFileSync(file, scoped, "utf8");
      n += 1;
    }
  }
  console.log(`Rescoped ${n} stylesheet(s).`);
  process.exit(0);
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node scripts/ingest-live-capture.mjs <capture-file> [...]");
  process.exit(1);
}

const keys = new Set(Object.keys(readManifest()));
const pages = {};
for (const file of files) {
  for (const cap of readCaptures(file)) {
    // Links that are 404s on sap.com itself aren't pages to clone.
    if (cap.pageNotFound) {
      console.log(`skipped (404 on sap.com): ${cap.slug}`);
      continue;
    }
    keys.add(cap.slug);
    const links = [];
    for (const name of cap.sheets) {
      if (cap.css[name] != null) links.push(saveCss(name, cap.css[name], cap.sheetUrls?.[name] || `${SITE}/`));
      else if (fs.existsSync(path.join(styleDir, name.replace(/[^\w.-]/g, "_")))) links.push(`/captured/styles/live/${name.replace(/[^\w.-]/g, "_")}`);
    }
    // Web-component (shadow DOM) stylesheets: linked from inside the
    // serialized <template shadowrootmode> roots. Shadow DOM already isolates
    // them, so they're saved as-is (no scoping).
    for (const [name, text] of Object.entries(cap.shadowCss || {})) {
      const file = path.join(styleDir, name.replace(/[^\w.-]/g, "_"));
      if (!fs.existsSync(file)) fs.writeFileSync(file, fixCssUrls(text, `${SITE}/`), "utf8");
    }
    // Document-level styles set up by SAP's scripts: every <style> tag and
    // document.adoptedStyleSheets (UI5 theme variables, the 72 font, Stencil
    // component styles). Each is a shared, content-hashed file; the capture
    // only sends a sheet's text the first time a run sees it.
    if (cap.docSheets?.length) {
      for (const name of cap.docSheets) {
        const safe = name.replace(/[^\w.-]/g, "_");
        if (cap.docCss?.[name] != null) links.push(saveCss(safe, cap.docCss[name], `${SITE}/`));
        else if (fs.existsSync(path.join(styleDir, safe))) links.push(`/captured/styles/live/${safe}`);
        else console.warn(`  missing document stylesheet ${name} for ${cap.slug}`);
      }
    } else if (cap.inlineCss) {
      const hash = crypto.createHash("sha1").update(cap.inlineCss).digest("hex").slice(0, 12);
      links.push(saveCss(`inline-${hash}.css`, cap.inlineCss, `${SITE}/`));
    }
    const attr = (v) => String(v || "").replace(/"/g, "&quot;");
    const body =
      links.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n") +
      `\n<div class="captured-body ${attr(cap.bodyClass)}">` +
      // Page-level bars between SAP's masthead and <main> (e.g. the Edge
      // Delivery secondary navigation on blog/resource pages).
      (cap.beforeMain || "") +
      `<div class="captured-main ${attr(cap.mainClass)}">` +
      cap.main + "</div>" + (cap.extras ? `\n${cap.extras}` : "") + "</div>";
    pages[cap.slug] = {
      title: cap.title,
      description: cap.description,
      body: null,
      raw: absolutizeMedia(body, cap.url || `${SITE}/${cap.slug}`),
    };
  }
}
for (const page of Object.values(pages)) {
  page.body = localizeBody(page.raw, keys);
  delete page.raw;
}
writePages(pages);
console.log(`Imported ${Object.keys(pages).length} page(s): ${Object.keys(pages).join(", ")}`);
