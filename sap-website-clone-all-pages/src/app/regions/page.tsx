import type { Metadata } from "next";
import RegionsPageContent from "@/components/RegionsPageContent";

export const metadata: Metadata = {
  title: "SAP Worldwide Sites | Local Private Clone",
  description:
    "Index of all captured SAP country and regional sites in this local replica.",
};

export default function RegionsPage() {
  return <RegionsPageContent />;
}
