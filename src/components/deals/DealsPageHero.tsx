"use client";

import { DealsCarouselHero } from "@/components/deals/DealsCarouselHero";
import type { ProductListItem } from "@/lib/types";

interface DealsPageHeroProps {
  deals: ProductListItem[];
  activeCategoryLabel?: string;
}

export function DealsPageHero({ deals, activeCategoryLabel }: DealsPageHeroProps) {
  return (
    <DealsCarouselHero deals={deals} activeCategoryLabel={activeCategoryLabel} />
  );
}
