"use client";

import { DealSpotlight } from "@/components/DealSpotlight";
import { useAuth } from "@/hooks/useAuth";
import type { Product } from "@/lib/types";

export function DealSpotlightGate({ product }: { product: Product }) {
  const { user, isReady } = useAuth();

  if (!isReady || user) {
    return null;
  }

  return <DealSpotlight product={product} />;
}
