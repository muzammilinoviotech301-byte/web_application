import AccountPageContent from "@/components/AccountPageContent";
import { accountMetadata } from "@/data/account-pages";

export const metadata = accountMetadata("account");

export default function AccountPage() {
  return <AccountPageContent pageKey="account" />;
}
