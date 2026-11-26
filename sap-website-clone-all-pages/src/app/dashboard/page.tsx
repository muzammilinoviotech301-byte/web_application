import AccountPageContent from "@/components/AccountPageContent";
import { accountMetadata } from "@/data/account-pages";

export const metadata = accountMetadata("dashboard");

export default function DashboardPage() {
  return <AccountPageContent pageKey="dashboard" />;
}
