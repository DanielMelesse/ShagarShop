import { SellerListings } from "@/components/seller/SellerListings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Seller — ShagarShop",
  description: "Manage your product listings on ShagarShop.",
};

export default function SellerPage() {
  return <SellerListings />;
}
