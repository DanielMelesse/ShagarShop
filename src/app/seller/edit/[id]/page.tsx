import { SellerEditProduct } from "@/components/seller/SellerEditProduct";

export const dynamic = "force-dynamic";

interface SellerEditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata() {
  return { title: "Edit product — ShagarShop Seller" };
}

export default async function SellerEditPage({ params }: SellerEditPageProps) {
  const { id } = await params;
  return <SellerEditProduct productId={id} />;
}
