import { SellerViewProduct } from "@/components/seller/SellerViewProduct";

export const dynamic = "force-dynamic";

interface SellerViewPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata() {
  return { title: "View product — ShagarShop Seller" };
}

export default async function SellerViewPage({ params }: SellerViewPageProps) {
  const { id } = await params;
  return <SellerViewProduct productId={id} />;
}
