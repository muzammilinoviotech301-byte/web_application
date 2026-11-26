import AccountPageContent from "@/components/AccountPageContent";
import { accountMetadata } from "@/data/account-pages";

export const metadata = accountMetadata("shopping-cart");

export default function ShoppingCartPage() {
  return <AccountPageContent pageKey="shopping-cart" />;
}
