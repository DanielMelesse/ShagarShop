import { SellerOrders } from "@/components/seller/SellerOrders";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Orders — ShegerShop Seller",
  description: "View and fulfill buyer orders on ShegerShop.",
};

export default function SellerOrdersPage() {
  return <SellerOrders />;
}
