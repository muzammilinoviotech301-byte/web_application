import AccountPageContent from "@/components/AccountPageContent";
import { accountMetadata } from "@/data/account-pages";

export const metadata = accountMetadata("orders");

export default function OrdersPage() {
  return <AccountPageContent pageKey="orders" />;
}
