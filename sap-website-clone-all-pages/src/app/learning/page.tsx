import AccountPageContent from "@/components/AccountPageContent";
import { accountMetadata } from "@/data/account-pages";

export const metadata = accountMetadata("learning");

export default function LearningPage() {
  return <AccountPageContent pageKey="learning" />;
}
