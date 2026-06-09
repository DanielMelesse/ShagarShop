"use client";

import { GuestHomeHero } from "@/components/home/GuestHomeHero";
import { BestProductHero } from "@/components/home/BestProductHero";
import { useAuth } from "@/hooks/useAuth";
import type { Product } from "@/lib/types";

export function HomeHero({ bestProduct }: { bestProduct: Product | null }) {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return <GuestHomeHero />;
  }

  if (user && bestProduct) {
    return <BestProductHero product={bestProduct} userName={user.name} />;
  }

  return <GuestHomeHero />;
}
