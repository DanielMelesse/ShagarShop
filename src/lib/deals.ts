import type { ProductListItem } from "@/lib/types";

type Dealable = Pick<ProductListItem, "id" | "price" | "rating">;

/** Stable "was" price for demo deals (no list price in DB). */
export function getListPrice(price: number, productId: string): number {
  const seed = productId.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const discountPct = 15 + (seed % 21);
  return Math.round((price / (1 - discountPct / 100)) * 100) / 100;
}

export function getSavingsPercent(price: number, listPrice: number): number {
  return Math.round((1 - price / listPrice) * 100);
}

export function getDealMeta(product: Dealable) {
  const listPrice = getListPrice(product.price, product.id);
  const savingsPercent = getSavingsPercent(product.price, listPrice);
  return { listPrice, savingsPercent };
}

export function sortDeals<T extends Dealable>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const saveA = getSavingsPercent(a.price, getListPrice(a.price, a.id));
    const saveB = getSavingsPercent(b.price, getListPrice(b.price, b.id));
    if (saveB !== saveA) return saveB - saveA;
    return b.rating - a.rating;
  });
}

/** Fisher–Yates shuffle for a fresh random deal order each page load. */
export function shuffleDeals<T>(products: T[]): T[] {
  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
