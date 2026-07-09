"use client";

import type { ShippingLineInput } from "@/lib/shipping";
import { useTranslations } from "@/context/LocaleContext";
import { calculateOrderTotals, formatPrice } from "@/lib/products";

interface OrderSummaryProps {
  subtotal: number;
  shippingLines?: ShippingLineInput[];
  variant?: "light" | "dark";
  className?: string;
}

export function OrderSummary({
  subtotal,
  shippingLines = [],
  variant = "light",
  className = "",
}: OrderSummaryProps) {
  const { t } = useTranslations();
  const { total } = calculateOrderTotals(subtotal, shippingLines);
  const isDark = variant === "dark";
  const labelClass = isDark ? "text-zinc-400" : "text-zinc-500";
  const valueClass = isDark ? "text-white" : "text-zinc-900";

  return (
    <dl className={`text-sm ${className}`}>
      <div className={`flex justify-between text-base font-bold ${valueClass}`}>
        <dt className={labelClass}>{t("common.total")}</dt>
        <dd>{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}
