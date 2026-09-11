import { SellerPageHeader } from "@/components/seller/SellerPageHeader";
import { TrackingScanPanel } from "@/components/TrackingScanPanel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scan package — ShegerShop Seller",
  description: "Scan or enter a tracking code to update package status.",
};

export default function SellerScanPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <SellerPageHeader
        title="Scan package"
        description="Read the tracking code on the package to mark it ready for delivery."
      />
      <div className="mt-8">
        <TrackingScanPanel
          title="Scan tracking code"
          description="Use your phone camera or type the code written on the package."
          roleHint="Seller: mark packages ready after labeling them."
        />
      </div>
    </div>
  );
}
