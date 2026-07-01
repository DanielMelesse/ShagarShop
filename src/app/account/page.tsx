import { AccountOverview } from "@/components/account/AccountOverview";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My account — ShagarShop",
  description: "Manage your ShagarShop account, orders, and profile.",
};

export default function AccountPage() {
  return <AccountOverview />;
}
