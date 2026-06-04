import type { Product as DbProduct } from "@prisma/client";
import type { Category, Product } from "@/lib/types";

const CATEGORY_IDS: Category[] = [
  "electronics",
  "fashion",
  "home",
  "sports",
  "books",
];

export function isCategory(value: string): value is Category {
  return CATEGORY_IDS.includes(value as Category);
}

export function toProduct(row: DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: isCategory(row.category) ? row.category : "electronics",
    image: row.image,
    rating: row.rating,
    reviewCount: row.reviewCount,
    stock: row.stock,
    featured: row.featured,
  };
}
