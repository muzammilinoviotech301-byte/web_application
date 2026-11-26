import type { Metadata } from "next";
import { Suspense } from "react";
import AuthUtilityForm from "@/components/AuthUtilityForm";

export const metadata: Metadata = {
  title: "Verify your e-mail | SAP",
  description: "Verify your e-mail address to finish creating your SAP ID.",
};

type Props = {
  searchParams: Promise<{ email?: string | string[]; next?: string | string[] }>;
};

export default function VerifyEmailPage({ searchParams }: Props) {
  return (
    <div className="sapreg-page">
      <Suspense fallback={<p className="account-loading">Loading registration…</p>}>
        <VerifyEmailLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function VerifyEmailLoader({ searchParams }: Props) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const next = typeof params.next === "string" ? params.next : undefined;
  return <AuthUtilityForm variant="verify-email" initialEmail={email} next={next} />;
}
