import AccountPageContent from "@/components/AccountPageContent";
import { accountMetadata } from "@/data/account-pages";

export const metadata = accountMetadata("inbox");

export default function InboxPage() {
  return <AccountPageContent pageKey="inbox" />;
}
