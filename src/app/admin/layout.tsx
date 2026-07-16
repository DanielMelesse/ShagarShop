import { AdminLayoutGate } from "@/components/admin/AdminLayoutGate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutGate>{children}</AdminLayoutGate>;
}
