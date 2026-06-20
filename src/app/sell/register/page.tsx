import { SellerRegistrationWizard } from "@/components/seller/register/SellerRegistrationWizard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Seller registration — ShagarShop",
  description: "Register as a seller on ShagarShop in three simple steps.",
};

export default function SellerRegisterPage() {
  return <SellerRegistrationWizard />;
}
