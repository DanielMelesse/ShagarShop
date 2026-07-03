import { SellerDashboard } from "@/components/seller/SellerDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Seller dashboard — ShegerShop",
  description: "Overview of your shop, orders, and listings on ShegerShop.",
};

export default function SellerPage() {
  return <SellerDashboard />;
}
