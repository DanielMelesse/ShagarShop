import { SellerOrders } from "@/components/seller/SellerOrders";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Orders — ShagarShop Seller",
  description: "View and fulfill buyer orders on ShagarShop.",
};

export default function SellerOrdersPage() {
  return <SellerOrders />;
}
