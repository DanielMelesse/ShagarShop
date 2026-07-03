import { SellerListings } from "@/components/seller/SellerListings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Listings — ShegerShop Seller",
  description: "Manage your product listings on ShegerShop.",
};

export default function SellerListingsPage() {
  return <SellerListings />;
}
