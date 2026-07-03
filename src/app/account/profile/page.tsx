import { AccountProfile } from "@/components/account/AccountProfile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile — ShegerShop Account",
  description: "Update your name, email, and password.",
};

export default function AccountProfilePage() {
  return <AccountProfile />;
}
