import { AccountShopSettings } from "@/components/account/AccountShopSettings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop settings — ShagarShop Account",
  description: "Manage your seller shop profile on ShagarShop.",
};

export default function AccountShopPage() {
  return <AccountShopSettings />;
}
