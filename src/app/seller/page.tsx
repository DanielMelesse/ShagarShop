import { SellerDashboard } from "@/components/seller/SellerDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Seller dashboard — ShagarShop",
  description: "Overview of your shop, orders, and listings on ShagarShop.",
};

export default function SellerPage() {
  return <SellerDashboard />;
}
