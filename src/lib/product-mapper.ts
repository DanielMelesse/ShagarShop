import type { Product as DbProduct } from "@prisma/client";
import { normalizeProductImages } from "@/lib/product-image";
import { categories } from "@/lib/products";
import type { Category, Product } from "@/lib/types";

const CATEGORY_IDS: Category[] = categories.map((c) => c.id);

export function isCategory(value: string): value is Category {
  return CATEGORY_IDS.includes(value as Category);
}

export function toProduct(row: DbProduct): Product {
  const images = normalizeProductImages(row.image, row.images);

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    image: images[0] ?? row.image,
    images,
    rating: row.rating,
    reviewCount: row.reviewCount,
    stock: row.stock,
    featured: row.featured,
    size: row.size,
  };
}
