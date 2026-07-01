import { SellerListings } from "@/components/seller/SellerListings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Listings — ShagarShop Seller",
  description: "Manage your product listings on ShagarShop.",
};

export default function SellerListingsPage() {
  return <SellerListings />;
}
