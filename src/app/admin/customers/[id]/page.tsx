import { AdminCustomerDetailPage } from "@/components/admin/AdminCustomerDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <AdminCustomerDetailPage customerId={id} />;
}
