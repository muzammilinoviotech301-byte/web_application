import type { Metadata } from "next";
import { Suspense } from "react";
import AuthUtilityForm from "@/components/AuthUtilityForm";

export const metadata: Metadata = {
  title: "Change Password | SAP",
  description: "Choose a new password for your SAP Universal ID.",
};

type Props = {
  searchParams: Promise<{ email?: string | string[]; next?: string | string[] }>;
};

export default function ResetPasswordPage({ searchParams }: Props) {
  return (
    <>
      <Suspense fallback={<p className="account-loading">Loading SAP.com…</p>}>
        <ResetPasswordLoader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ResetPasswordLoader({ searchParams }: Props) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const next = typeof params.next === "string" ? params.next : undefined;
  return <AuthUtilityForm variant="reset-password" initialEmail={email} next={next} />;
}
