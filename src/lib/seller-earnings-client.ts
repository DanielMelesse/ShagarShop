import type { SellerEarningsSummary } from "@/lib/seller-earnings";

export async function fetchSellerEarnings(): Promise<
  | { ok: true; earnings: SellerEarningsSummary }
  | { ok: false; error: string }
> {
  const res = await fetch("/api/seller/earnings", {
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error:
        typeof data.error === "string"
          ? data.error
          : "Could not load earnings.",
    };
  }
  return { ok: true, earnings: data.earnings };
}
