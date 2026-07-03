import { SellerRegistrationWizard } from "@/components/seller/register/SellerRegistrationWizard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Seller registration — ShegerShop",
  description: "Register as a seller on ShegerShop in three simple steps.",
};

export default function SellerRegisterPage() {
  return <SellerRegistrationWizard />;
}
