import AccountPageContent from "@/components/AccountPageContent";
import { accountMetadata } from "@/data/account-pages";

export const metadata = accountMetadata("email-preferences");

export default function EmailPreferencesPage() {
  return <AccountPageContent pageKey="email-preferences" />;
}
