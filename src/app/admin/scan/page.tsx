import { AdminShell } from "@/components/admin/AdminShell";
import { TrackingScanPanel } from "@/components/TrackingScanPanel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scan package — ShegerShop Admin",
  description: "Scan or enter a tracking code to verify and update package status.",
};

export default function AdminScanPage() {
  return (
    <AdminShell
      title="Scan package"
      description="Employees can read tracking codes to verify packages and update status."
    >
      <TrackingScanPanel
        title="Scan tracking code"
        description="Use a phone camera or type the code written on the package."
        roleHint="Employee: override package status when helping sellers or couriers."
      />
    </AdminShell>
  );
}
