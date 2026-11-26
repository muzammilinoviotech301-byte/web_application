import type { SitePage } from "@/data/pages";

// `slug` adds a per-page class (e.g. "page-mena-products") so CSS that
// reproduces SAP's per-page runtime layout can be scoped to that page.
export default function PageContent({ page, slug }: { page: SitePage; slug?: string }) {
  const pageClass = slug ? ` page-${slug.replace(/\//g, "-")}` : "";
  const communityClass =
    slug === "community" || slug?.startsWith("community/") || slug?.startsWith("t5/")
      ? " page-community"
      : "";
  return (
    <div
      className={`captured-page${communityClass}${pageClass}`}
      dangerouslySetInnerHTML={{ __html: page.body }}
    />
  );
}
