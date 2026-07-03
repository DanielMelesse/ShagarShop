import { SellerAddProduct } from "@/components/seller/SellerAddProduct";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Add product — ShegerShop Seller",
  description: "List a new product on ShegerShop.",
};

export default function SellerAddPage() {
  return <SellerAddProduct />;
}
