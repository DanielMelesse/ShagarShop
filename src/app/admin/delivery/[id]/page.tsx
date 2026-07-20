import { AdminCourierDetailPage } from "@/components/admin/AdminCourierDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <AdminCourierDetailPage courierId={id} />;
}
