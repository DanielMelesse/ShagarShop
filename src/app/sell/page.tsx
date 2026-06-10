import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SellLanding } from "@/components/seller/SellLanding";
import { SellerDashboard } from "@/components/seller/SellerDashboard";
import { isSellerRole } from "@/lib/user-role";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sell on ShagarShop",
  description: "List your products and reach buyers on ShagarShop.",
};

export default async function SellPage() {
  const session = await getServerSession(authOptions);

  if (session?.user && isSellerRole(session.user.role)) {
    return <SellerDashboard user={session.user} />;
  }

  return <SellLanding />;
}
