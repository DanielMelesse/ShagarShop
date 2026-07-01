import { AccountOrders } from "@/components/account/AccountOrders";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Orders — ShagarShop Account",
  description: "View your order history on ShagarShop.",
};

export default function AccountOrdersPage() {
  return <AccountOrders />;
}
