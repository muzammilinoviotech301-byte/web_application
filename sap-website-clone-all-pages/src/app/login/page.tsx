import type { Metadata } from "next";
import { Suspense } from "react";
import SignInForm from "@/components/SignInForm";

export const metadata: Metadata = {
  title: "SAP.com: Sign In | SAP",
  description: "Sign in with your SAP Universal ID.",
};

type Props = {
  searchParams: Promise<{ email?: string | string[]; next?: string | string[] }>;
};

export default function LoginPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div className="sapid-page" />}>
      <SignInLoader searchParams={searchParams} />
    </Suspense>
  );
}

async function SignInLoader({ searchParams }: Props) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const next = typeof params.next === "string" ? params.next : undefined;

  return <SignInForm initialEmail={email} next={next} />;
}
