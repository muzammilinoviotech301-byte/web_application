import { notFound } from "next/navigation";
import { Suspense } from "react";
import AccountPageContent from "@/components/AccountPageContent";
import {
  ACCOUNT_PAGES,
  accountMetadata,
  type AccountPageKey,
} from "@/data/account-pages";

const PRODUCT_KEYS = ["ariba", "concur", "fieldglass", "successfactors"] as const;

type Props = {
  params: Promise<{ product: string }>;
};

export function generateStaticParams() {
  return PRODUCT_KEYS.map((product) => ({ product }));
}

export async function generateMetadata({ params }: Props) {
  const { product } = await params;
  if (!(product in ACCOUNT_PAGES)) return { title: "Product login | SAP" };
  return accountMetadata(product as AccountPageKey);
}

export default function ProductLoginPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="account-loading">Loading product login…</p>}>
      <ProductLoginLoader params={params} />
    </Suspense>
  );
}

async function ProductLoginLoader({ params }: Props) {
  const { product } = await params;
  if (!(product in ACCOUNT_PAGES)) notFound();

  return <AccountPageContent pageKey={product as AccountPageKey} />;
}
