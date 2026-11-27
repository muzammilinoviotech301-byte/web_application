import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import ClientCapturedContent from "@/components/ClientCapturedContent";
import { getPage, getPageMeta } from "@/data/pages";

const slug = "industries/autonomous-asset-management";

export const instant = false;

export function generateMetadata(): Metadata {
  const meta = getPageMeta(slug);
  return {
    title: meta?.title ?? "Autonomous Asset Management | SAP",
    description: meta?.description,
    alternates: {
      canonical: "https://www.sap.com/mena/industries/autonomous-asset-management.html",
    },
  };
}

async function CapturedPage() {
  // This capture contains SAP's full declarative shadow DOM. Inserting it
  // after hydration avoids a mismatch between the parsed server HTML and the
  // client tree, which was crashing the page.
  await connection();
  const page = await getPage(slug);
  if (!page) return null;
  return (
    <ClientCapturedContent
      html={page.body}
      className={`captured-page page-${slug.replace(/\//g, "-")}`}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CapturedPage />
    </Suspense>
  );
}
