import { AccountOrders } from "@/components/account/AccountOrders";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Orders — ShegerShop Account",
  description: "View your order history on ShegerShop.",
};

export default function AccountOrdersPage() {
  return <AccountOrders />;
}
