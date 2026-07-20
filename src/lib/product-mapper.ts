import type { Product as DbProduct } from "@prisma/client";
import { normalizeProductCondition } from "@/lib/product-condition";
import { normalizeProductImages } from "@/lib/product-image";
import { categories } from "@/lib/products";
import type { Category, Product, ProductListItem } from "@/lib/types";

const CATEGORY_IDS: Category[] = categories.map((c) => c.id);

/** Prisma select for listing/search — omits description + images[]. */
export const PRODUCT_LIST_SELECT = {
  id: true,
  name: true,
  price: true,
  category: true,
  image: true,
  rating: true,
  reviewCount: true,
  stock: true,
  featured: true,
  size: true,
  shippingTier: true,
  extraShippingBirr: true,
  condition: true,
  sellerId: true,
} as const;

export type ProductListRow = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  stock: number;
  featured: boolean;
  size: string | null;
  shippingTier: string;
  extraShippingBirr: number;
  condition: string;
  sellerId: string | null;
};

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
    shippingTier: row.shippingTier,
    extraShippingBirr: row.extraShippingBirr,
    condition: normalizeProductCondition(row.condition),
    sellerId: row.sellerId,
  };
}

export function toProductListItem(row: ProductListRow): ProductListItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    category: row.category,
    image: row.image,
    rating: row.rating,
    reviewCount: row.reviewCount,
    stock: row.stock,
    featured: row.featured,
    size: row.size,
    shippingTier: row.shippingTier,
    extraShippingBirr: row.extraShippingBirr,
    condition: normalizeProductCondition(row.condition),
    sellerId: row.sellerId,
  };
}

/** Expand a list item into a cart-safe Product (no heavy description/gallery). */
export function listItemToCartProduct(item: ProductListItem): Product {
  return {
    id: item.id,
    name: item.name,
    description: "",
    price: item.price,
    category: item.category,
    image: item.image,
    images: [item.image],
    rating: item.rating,
    reviewCount: item.reviewCount,
    stock: item.stock,
    featured: item.featured,
    size: item.size,
    shippingTier: item.shippingTier,
    extraShippingBirr: item.extraShippingBirr,
    condition: item.condition,
    sellerId: item.sellerId,
  };
}

export function slimProductForCart(product: Product): Product {
  return {
    id: product.id,
    name: product.name,
    description: "",
    price: product.price,
    category: product.category,
    image: product.image,
    images: [product.image],
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: product.stock,
    featured: product.featured,
    size: product.size,
    shippingTier: product.shippingTier,
    extraShippingBirr: product.extraShippingBirr,
    condition: product.condition,
    sellerId: product.sellerId,
  };
}
