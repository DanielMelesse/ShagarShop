import { AccountShopSettings } from "@/components/account/AccountShopSettings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop settings — ShegerShop Account",
  description: "Manage your seller shop profile on ShegerShop.",
};

export default function AccountShopPage() {
  return <AccountShopSettings />;
}
