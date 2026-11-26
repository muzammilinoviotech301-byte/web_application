import { notFound } from "next/navigation";
import { Suspense } from "react";
import AccountPageContent from "@/components/AccountPageContent";
import {
  ACCOUNT_PAGES,
  accountMetadata,
  type AccountPageKey,
} from "@/data/account-pages";

const SECTION_KEYS = [
  "manage-account",
  "personal-information",
  "company-information",
  "contact-preferences",
  "password",
  "multi-factor-authentication",
  "certificates",
  "sessions",
  "access-tokens",
  "my-data",
  "social-sign-on",
] as const;

type Props = {
  params: Promise<{ section: string }>;
};

export function generateStaticParams() {
  return SECTION_KEYS.map((section) => ({ section }));
}

export async function generateMetadata({ params }: Props) {
  const { section } = await params;
  if (!(section in ACCOUNT_PAGES)) return { title: "Account | SAP" };
  return accountMetadata(section as AccountPageKey);
}

export default function AccountSectionPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="account-loading">Loading account…</p>}>
      <AccountSectionLoader params={params} />
    </Suspense>
  );
}

async function AccountSectionLoader({ params }: Props) {
  const { section } = await params;
  if (!(section in ACCOUNT_PAGES)) notFound();

  return <AccountPageContent pageKey={section as AccountPageKey} />;
}
