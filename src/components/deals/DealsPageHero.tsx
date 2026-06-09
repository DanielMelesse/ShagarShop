"use client";

import { BestDealHero } from "@/components/deals/BestDealHero";
import { DealsHero } from "@/components/DealsHero";
import { useAuth } from "@/hooks/useAuth";
import type { Product } from "@/lib/types";

interface DealsPageHeroProps {
  bestDeal: Product | null;
  dealCount: number;
  activeCategoryLabel?: string;
}

export function DealsPageHero({
  bestDeal,
  dealCount,
  activeCategoryLabel,
}: DealsPageHeroProps) {
  const { user, isReady } = useAuth();

  if (!isReady || !user || !bestDeal) {
    return (
      <DealsHero dealCount={dealCount} activeCategoryLabel={activeCategoryLabel} />
    );
  }

  return (
    <BestDealHero
      product={bestDeal}
      userName={user.name}
      activeCategoryLabel={activeCategoryLabel}
    />
  );
}
