import { SellerAddProduct } from "@/components/seller/SellerAddProduct";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Add product — ShagarShop Seller",
  description: "List a new product on ShagarShop.",
};

export default function SellerAddPage() {
  return <SellerAddProduct />;
}
