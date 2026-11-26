import type { Metadata } from "next";
import { Suspense } from "react";
import RegistrationForm from "@/components/RegistrationForm";

export const metadata: Metadata = {
  title: "Register | SAP",
  description: "Register for an SAP ID and access all SAP resources.",
};

type Props = {
  searchParams: Promise<{ email?: string | string[]; next?: string | string[] }>;
};

export default function RegisterPage({ searchParams }: Props) {
  return (
    <div className="sapreg-page">
      <Suspense fallback={<p className="account-loading">Loading registration…</p>}>
        <RegistrationLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RegistrationLoader({ searchParams }: Props) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const next = typeof params.next === "string" ? params.next : undefined;

  return <RegistrationForm initialEmail={email} next={next} />;
}
