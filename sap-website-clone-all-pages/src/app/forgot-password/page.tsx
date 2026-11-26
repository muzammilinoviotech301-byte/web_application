import type { Metadata } from "next";
import { Suspense } from "react";
import AuthUtilityForm from "@/components/AuthUtilityForm";

export const metadata: Metadata = {
  title: "Reset Password | SAP",
  description: "Reset your SAP Universal ID password.",
};

type Props = {
  searchParams: Promise<{ email?: string | string[]; next?: string | string[] }>;
};

export default function ForgotPasswordPage({ searchParams }: Props) {
  return (
    <>
      <Suspense fallback={<p className="account-loading">Loading SAP.com…</p>}>
        <ForgotPasswordLoader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ForgotPasswordLoader({ searchParams }: Props) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const next = typeof params.next === "string" ? params.next : undefined;
  return <AuthUtilityForm variant="forgot-password" initialEmail={email} next={next} />;
}
