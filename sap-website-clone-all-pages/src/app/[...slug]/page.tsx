import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PageContent from "@/components/PageContent";
import { getPage, getPageMeta, pageKeys, slugFromSegments } from "@/data/pages";
import { regionFromPathname, stripRegionPrefix } from "@/data/regions";

type Props = {
  params: Promise<{ slug: string[] }>;
};

// Page bodies are read from disk on demand, so these routes intentionally
// block instead of being validated as instant navigations.
export const instant = false;

export function generateStaticParams() {
  return pageKeys
    .filter((key) => key !== "index")
    .map((key) => ({ slug: key.split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = getPageMeta(slugFromSegments(slug));
  if (!meta) return { title: "Not found | SAP" };
  return {
    title: meta.title,
    description: meta.description,
  };
}

export default async function SitePageRoute({ params }: Props) {
  const { slug } = await params;
  const key = slugFromSegments(slug);
  const page = await getPage(key);
  if (!page) {
    // A region-prefixed page without a localized capture falls back to the
    // global capture, then to that region's homepage. This keeps the current
    // page when switching regions instead of always landing on the homepage.
    const region = regionFromPathname(`/${key}`);
    if (region) {
      const rest = stripRegionPrefix(`/${key}`);
      if (rest !== "/") {
        const global = rest.slice(1);
        if (getPageMeta(global)) redirect(`/${global}`);
      }
      if (key !== region.href.slice(1)) redirect(region.href);
      notFound();
    }
    // Any other sap.com page that isn't part of the local clone: open the
    // live page instead of a dead end (files like .js/.png stay 404s).
    if (/^[\w][\w/.-]*$/.test(key) && !/\.[a-z0-9]{2,4}$/i.test(key)) {
      redirect(`https://www.sap.com/${key}.html`);
    }
    notFound();
  }
  return <PageContent page={page} slug={key} />;
}
