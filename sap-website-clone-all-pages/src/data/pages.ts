import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import manifest from "../../content/manifest.json";

// Page metadata lives in content/manifest.json (small, bundled).
// Page bodies live in content/pages/<slug>.html and are read on demand,
// so no route ever loads the full captured site into memory.
// Both are produced by scripts/import-pages.mjs (see scripts/lib/page-store.mjs).

export type PageMeta = {
  title: string;
  description: string;
};

export type SitePage = PageMeta & {
  body: string;
};

const pageManifest: Record<string, PageMeta> = manifest;
const pagesDir = path.join(process.cwd(), "content", "pages");

export const pageKeys = Object.keys(pageManifest);

export function slugFromSegments(segments: string[]): string {
  return segments.join("/");
}

export function getPageMeta(slug: string): PageMeta | undefined {
  return Object.hasOwn(pageManifest, slug) ? pageManifest[slug] : undefined;
}

export async function getPage(slug: string): Promise<SitePage | undefined> {
  "use cache";
  cacheLife("max");

  // Only slugs listed in the manifest are read, which also rules out
  // path traversal through crafted URL segments.
  const meta = getPageMeta(slug);
  if (!meta) return undefined;

  const body = await readFile(path.join(pagesDir, `${slug}.html`), "utf8");
  return { ...meta, body };
}
