import { AccountOrderDetail } from "@/components/account/AccountOrderDetail";

export const dynamic = "force-dynamic";

interface AccountOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata() {
  return {
    title: "Order details — ShegerShop",
    description: "View your order details on ShegerShop.",
  };
}

export default async function AccountOrderDetailPage({
  params,
}: AccountOrderDetailPageProps) {
  const { id } = await params;
  return <AccountOrderDetail orderId={id} />;
}
