import { AccountLayoutGate } from "@/components/account/AccountLayoutGate";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountLayoutGate>{children}</AccountLayoutGate>;
}
