import { SellerEarnings } from "@/components/seller/SellerEarnings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Earnings — ShegerShop Seller",
  description: "Track seller earnings, fees, and payouts on ShegerShop.",
};

export default function SellerEarningsPage() {
  return <SellerEarnings />;
}
