import { notFound } from "next/navigation";
import { Suspense } from "react";
import AccountPageContent from "@/components/AccountPageContent";
import { accountMetadata, type AccountPageKey } from "@/data/account-pages";

const SECTION_PAGE_KEYS = {
  "what-is-new": "what-is-new",
  "marketing-preferences": "marketing-preferences",
  learnings: "dashboard-learnings",
  trials: "dashboard-trials",
  events: "events",
  demos: "demos",
  newsletters: "newsletters",
  "recently-viewed": "recently-viewed",
  "saved-items": "saved-items",
  recommendations: "recommendations",
  interests: "interests",
} as const satisfies Record<string, AccountPageKey>;

type Props = {
  params: Promise<{ section: string }>;
};

function getDashboardPageKey(section: string): AccountPageKey | undefined {
  return (
    SECTION_PAGE_KEYS[section as keyof typeof SECTION_PAGE_KEYS] ?? undefined
  );
}

export function generateStaticParams() {
  return Object.keys(SECTION_PAGE_KEYS).map((section) => ({ section }));
}

export async function generateMetadata({ params }: Props) {
  const { section } = await params;
  const pageKey = getDashboardPageKey(section);
  if (!pageKey) return { title: "Dashboard | SAP" };
  return accountMetadata(pageKey);
}

export default function DashboardSectionPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="account-loading">Loading dashboard…</p>}>
      <DashboardSectionLoader params={params} />
    </Suspense>
  );
}

async function DashboardSectionLoader({ params }: Props) {
  const { section } = await params;
  const pageKey = getDashboardPageKey(section);
  if (!pageKey) notFound();

  return <AccountPageContent pageKey={pageKey} />;
}
