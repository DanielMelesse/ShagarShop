import { DeliveryNav } from "@/components/delivery/DeliveryNav";
import { TrackingScanPanel } from "@/components/TrackingScanPanel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scan package — ShegerShop Delivery",
  description: "Scan or enter a tracking code to claim or complete deliveries.",
};

export default function DeliveryScanPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Scan package</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Read the tracking code on the package to claim or mark delivered.
        </p>
        <div className="mt-6">
          <DeliveryNav />
        </div>
      </header>
      <TrackingScanPanel
        title="Scan tracking code"
        description="Use your phone camera or type the code from the package label."
        roleHint="Courier: claim available packages or mark your deliveries complete."
      />
    </div>
  );
}
