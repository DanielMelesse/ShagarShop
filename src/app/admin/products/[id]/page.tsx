import { AdminProductDetailPage } from "@/components/admin/AdminProductDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <AdminProductDetailPage productId={id} />;
}
