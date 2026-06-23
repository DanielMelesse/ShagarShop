import { redirect } from "next/navigation";
import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";

export default function HomePage() {
  redirect(TODAYS_DEALS_HREF);
}
