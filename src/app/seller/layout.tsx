import { SellerLayoutGate } from "@/components/seller/SellerLayoutGate";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <SellerLayoutGate>{children}</SellerLayoutGate>;
}
