"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchSellerShopName } from "@/lib/seller-products-client";
import { SellerNav } from "@/components/seller/SellerNav";

interface SellerPageHeaderProps {
  title?: string;
  description?: string;
}

export function SellerPageHeader({ title, description }: SellerPageHeaderProps) {
  const { user } = useAuth();
  const [shopName, setShopName] = useState<string | null>(null);

  useEffect(() => {
    void fetchSellerShopName().then(setShopName);
  }, []);

  return (
    <header>
      <p className="text-sm font-medium text-brand-700">{shopName ?? "Your shop"}</p>
      <h1 className="mt-1 text-2xl font-bold text-zinc-900">
        {title ?? "Seller dashboard"}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {description ?? (user ? `${user.name} · ${user.phone}` : "")}
      </p>
      <SellerNav />
    </header>
  );
}
