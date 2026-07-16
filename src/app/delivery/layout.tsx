import { DeliveryLayoutGate } from "@/components/delivery/DeliveryLayoutGate";

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DeliveryLayoutGate>{children}</DeliveryLayoutGate>;
}
