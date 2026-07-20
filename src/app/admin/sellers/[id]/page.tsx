import { AdminSellerDetailPage } from "@/components/admin/AdminSellerDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <AdminSellerDetailPage sellerId={id} />;
}
