import fs from "node:fs";
import path from "node:path";

// On-disk page store shared by the import and split scripts.
//
//   content/manifest.json          { [slug]: { title, description } }
//   content/pages/<slug>.html      the page body, links already normalized
//
// The app reads the manifest at build time and loads one body per request,
// instead of bundling every page into a single giant JSON module.

export const contentDir = path.resolve(process.cwd(), "content");
export const manifestFile = path.join(contentDir, "manifest.json");
export const pagesDir = path.join(contentDir, "pages");

const SLUG_PATTERN = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

export function assertSlug(slug) {
  if (!SLUG_PATTERN.test(slug)) throw new Error(`Invalid page slug: ${JSON.stringify(slug)}`);
}

// Rewrites links in captured HTML to app routes. Done once at write time
// so the app never has to run regexes over page bodies at request time.
export function normalizeHtml(html, pageKeys) {
  const linked = localizeMenaLinks(String(html), pageKeys)
    // Repair absolute URLs mangled by an earlier version of the rule below.
    .replace(/href="\/(https?:\/\/[^"]+)"/g, (_, url) => `href="${url.includes(".html") ? url : url.replace(/^(https?:\/\/[^"?#]*?)([?#]|$)/, "$1.html$2")}"`)
    .replace(/href="index\.html"/g, 'href="/"')
    // Only relative links are local pages; leave https://, mailto:, /root etc.
    .replace(/href="(?![a-z][a-z0-9+.-]*:|\/|#)([^"#?]+)\.html"/gi, 'href="/$1"')
    .replace(/src="assets\//g, 'src="/assets/')
    .replace(/url\(assets\//g, "url(/assets/");
  return balanceTags(markSectionPositions(activateLazyImages(unstickSecondaryNav(linked))));
}

// The capture scrolls each page to load lazy content, and SAP's script can
// leave the product sub-navigation in its "stuck while scrolling" state
// (position: fixed at the top). Pages are stored as they look at the top.
function unstickSecondaryNav(html) {
  return html
    .replace(/\s*\bSecondaryNavigation__sticky--[\w-]+/g, "")
    .replace(/\s*\bsecondary-nav-wrapper--sticky\b/g, "");
}

// Captured MENA pages link to /mena/... but only a few MENA pages were
// captured. Point each such link at the MENA page if it exists, else the
// captured global page, else the live sap.com/mena page (instead of a 404).
// Also drops ".html" from root-absolute MENA links.
export function localizeMenaLinks(html, pageKeys) {
  if (!pageKeys) return html;
  return html.replace(/href="\/mena\/([^"#?]*?)(?:\.html)?([?#][^"]*)?"/g, (whole, rawPath, suffix = "") => {
    const path = rawPath.replace(/\/$/, "").replace(/\/index$/, "");
    if (pageKeys.has(`mena/${path}`)) return `href="/mena/${path}${suffix}"`;
    if (path === "" || path === "index") return pageKeys.has("mena") ? 'href="/mena"' : 'href="/"';
    if (pageKeys.has(path)) return `href="/${path}${suffix}"`;
    return `href="https://www.sap.com/mena/${path}.html${suffix}"`;
  });
}

// Captured bodies sometimes carry stray closing tags (e.g. an extra </div>).
// Rendered inside the app's wrapper <div>, such a tag closes the wrapper early,
// the browser moves the rest of the page out of it, and React's hydration
// fails. Only closers that can reach the wrapper matter: </div> beyond the
// body's own depth, and </main>, </body>, </html>. Other strays are ignored
// by the browser anyway, and implicit closes (e.g. <p> before <div>) never
// affect <div> depth, so counting <div>s alone is safe.
const RAW_TEXT = /<(script|style|textarea|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const STRUCTURE_TAG = /<!--[\s\S]*?-->|<(\/?)(div|main|body|html)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;

export function balanceTags(html) {
  const raw = [];
  const masked = html.replace(RAW_TEXT, (block) => `\u0000${raw.push(block) - 1}\u0000`);
  let depth = 0;
  const balanced = masked.replace(STRUCTURE_TAG, (tag, closing, rawName) => {
    if (!rawName) return tag; // comment
    const name = rawName.toLowerCase();
    if (name !== "div") return closing ? "" : tag;
    if (!closing) {
      depth += 1;
      return tag;
    }
    if (depth === 0) return ""; // stray: would close the app's wrapper
    depth -= 1;
    return tag;
  });
  return (balanced + "</div>".repeat(depth)).replace(/\u0000(\d+)\u0000/g, (_, i) => raw[Number(i)]);
}

// SAP renders every image as an invisible placeholder (opacity 0, height from
// padding) and its JavaScript later swaps in a <picture>. That script never
// runs in the clone, so captured images stay invisible. This rewrites each
// placeholder that has a real src into the markup SAP produces once loaded.
const PLACEHOLDER_IMAGE =
  /<div class="Image__wrapper--g1IpI Image__placeholderWrapper--bvUrM"><div><\/div><img ([^>]*)>/g;

// The class SAP gives the loaded <img>, keyed by the wrapper that holds it.
// Components not listed here (e.g. VerticalTabs) render a class-less <img>.
const LOADED_IMAGE_CLASS = [
  ["ImageContent__", "ImageContent__image--Oh4_3"],
  ["TileHomepage__", "TileHomepage__image--XWCEK"],
  ["InteractiveVisual__", "InteractiveVisual__image--KwcnK"],
  ["TilePromoItem__", "TilePromoItem__image--rG0BB"],
];

function attr(attrs, name) {
  const match = new RegExp(`\b${name}="([^"]*)"`).exec(attrs);
  return match ? match[1] : undefined;
}

export function activateLazyImages(html) {
  return html.replace(PLACEHOLDER_IMAGE, (whole, attrs, offset, source) => {
    const src = attr(attrs, "src");
    if (!src || src.startsWith("data:")) return whole;

    const before = source.slice(Math.max(0, offset - 400), offset);
    const wrapperClasses = [...before.matchAll(/class="([^"]+)"/g)].at(-1)?.[1] ?? "";
    const imageClass = LOADED_IMAGE_CLASS.find(([prefix]) => wrapperClasses.startsWith(prefix))?.[1];

    const alt = attr(attrs, "alt") ?? "";
    const classAttr = imageClass ? ` class="${imageClass}"` : "";
    return (
      `<div class="Image__wrapper--g1IpI"><div>` +
      `<picture class="Image__pictureAlignment--ceI11" style="position: static;">` +
      `<img loading="lazy"${classAttr} src="${src}" alt="${alt}">` +
      `</picture></div>`
    );
  });
}

// SAP's JS tags each stacked <section> as first/middle/last, which sets its
// vertical padding (e.g. 84/56px). The SSR markup lacks those classes, so
// every section got first+last padding. Reapply them by document order.
const SECTION_CLASS = /class="Section__section--U5mm3((?: [^"]*)?)"/g;
const SECTION_POSITION = /Section__(first--k_EBQ|middle--E08PX|last--kypi_)/;

export function markSectionPositions(html) {
  const total = [...html.matchAll(SECTION_CLASS)].length;
  if (total < 2) return html;
  let index = 0;
  return html.replace(SECTION_CLASS, (whole, rest) => {
    const position =
      index === 0 ? "Section__first--k_EBQ" : index === total - 1 ? "Section__last--kypi_" : "Section__middle--E08PX";
    index += 1;
    if (SECTION_POSITION.test(rest)) return whole;
    return `class="Section__section--U5mm3 ${position}${rest}"`;
  });
}

export function readManifest() {
  if (!fs.existsSync(manifestFile)) return {};
  return JSON.parse(fs.readFileSync(manifestFile, "utf8"));
}

export function readBody(slug) {
  assertSlug(slug);
  return fs.readFileSync(path.join(pagesDir, `${slug}.html`), "utf8");
}

// Writes the given pages ({ [slug]: { title, description, body } }) into the
// store and merges their metadata into the manifest. Returns the full manifest.
export function writePages(pages) {
  const manifest = readManifest();
  // Every page that will exist after this write, so links between pages in
  // the same import resolve locally.
  const keys = new Set([...Object.keys(manifest), ...Object.keys(pages)]);
  for (const [slug, page] of Object.entries(pages)) {
    assertSlug(slug);
    const file = path.join(pagesDir, `${slug}.html`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    manifest[slug] = { title: page.title, description: page.description };
    fs.writeFileSync(file, normalizeHtml(page.body, keys), "utf8");
  }
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  fs.mkdirSync(contentDir, { recursive: true });
  fs.writeFileSync(manifestFile, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  return sorted;
}

// Re-applies normalizeHtml to every stored body (after the rules change).
export function renormalizeStore() {
  let changed = 0;
  const keys = new Set(Object.keys(readManifest()));
  for (const slug of keys) {
    const file = path.join(pagesDir, `${slug}.html`);
    const before = fs.readFileSync(file, "utf8");
    const after = normalizeHtml(before, keys);
    if (after !== before) {
      fs.writeFileSync(file, after, "utf8");
      changed += 1;
    }
  }
  return changed;
}
