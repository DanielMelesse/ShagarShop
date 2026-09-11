import { MyshopHome } from "@/components/seller/MyshopHome";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My shop — ShegerShop",
  description:
    "Open your shop on ShegerShop, or manage listings and orders from your seller dashboard.",
};

export default function MyshopPage() {
  return <MyshopHome />;
}
