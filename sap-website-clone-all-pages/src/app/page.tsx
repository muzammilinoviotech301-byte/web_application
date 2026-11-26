import type { Metadata } from "next";
import AnimatedHome from "@/components/AnimatedHome";
import PageContent from "@/components/PageContent";
import { getPage } from "@/data/pages";

export const metadata: Metadata = {
  title: "SAP MENA | ERP System Business Software Solutions | SAP",
  description:
    "Read how the software & business solutions from SAP Saudi KSA can help you turn data into better decisions and find the ERP system that's right for you and your business.",
};

export default async function Home() {
  const page = await getPage("index");
  if (!page) throw new Error("Home page content is missing from content/manifest.json");
  return (
    <AnimatedHome>
      <PageContent page={page} />
    </AnimatedHome>
  );
}
