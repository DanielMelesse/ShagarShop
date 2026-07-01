import { formatPrice } from "@/lib/products";

interface OrderSummaryProps {
  subtotal: number;
  variant?: "light" | "dark";
  className?: string;
}

export function OrderSummary({
  subtotal,
  variant = "light",
  className = "",
}: OrderSummaryProps) {
  const total = Math.round(subtotal * 100) / 100;
  const isDark = variant === "dark";
  const labelClass = isDark ? "text-zinc-400" : "text-zinc-500";
  const valueClass = isDark ? "text-white" : "text-zinc-900";

  return (
    <dl className={`text-sm ${className}`}>
      <div className={`flex justify-between text-base font-bold ${valueClass}`}>
        <dt className={labelClass}>Total</dt>
        <dd>{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}
