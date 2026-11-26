import AccountPageContent from "@/components/AccountPageContent";
import { accountMetadata } from "@/data/account-pages";

export const metadata = accountMetadata("trials");

export default function TrialsPage() {
  return <AccountPageContent pageKey="trials" />;
}
