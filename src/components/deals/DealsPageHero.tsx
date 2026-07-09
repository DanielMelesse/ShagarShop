"use client";

import { DealsCarouselHero } from "@/components/deals/DealsCarouselHero";
import type { Product } from "@/lib/types";

interface DealsPageHeroProps {
  deals: Product[];
  activeCategoryLabel?: string;
}

export function DealsPageHero({ deals, activeCategoryLabel }: DealsPageHeroProps) {
  return (
    <DealsCarouselHero deals={deals} activeCategoryLabel={activeCategoryLabel} />
  );
}
