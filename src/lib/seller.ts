import { categories, categoryNeedsSize, getSizeOptions } from "@/lib/products";
import { isCategory } from "@/lib/product-mapper";
import {
  isValidProductImage,
  productImageErrorMessage,
} from "@/lib/product-image";
import type { Category } from "@/lib/types";

export interface SellerProductInput {
  name: string;
  description: string;
  price: number;
  category: Category;
  stock: number;
  image: string;
  featured?: boolean;
  size?: string | null;
}

export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function makeProductId(name: string): string {
  const base = slugifyProductName(name) || "product";
  return `${base}-${Date.now().toString(36)}`;
}

function validateImage(image: string): boolean {
  return isValidProductImage(image);
}

function parseSizeForCategory(
  category: Category,
  raw: unknown,
): { ok: true; size: string | null } | { ok: false; error: string } {
  const size = String(raw ?? "").trim();

  if (!categoryNeedsSize(category)) {
    return { ok: true, size: null };
  }

  if (!size) {
    return { ok: false, error: "Size is required for fashion and sports." };
  }

  const allowed = getSizeOptions(category);
  if (!allowed.includes(size)) {
    return { ok: false, error: "Pick a valid size for this category." };
  }

  return { ok: true, size };
}

export function parseSellerProductInput(
  body: Record<string, unknown>,
): { ok: true; data: SellerProductInput } | { ok: false; error: string } {
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const category = String(body.category ?? "").trim();
  const image = String(body.image ?? "").trim();
  const price = Number(body.price);
  const stock = Number(body.stock);
  const featured = Boolean(body.featured);

  if (!name) return { ok: false, error: "Product name is required." };
  if (!description) return { ok: false, error: "Description is required." };
  if (!isCategory(category)) return { ok: false, error: "Pick a valid category." };
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, error: "Price must be greater than zero." };
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return { ok: false, error: "Stock must be a whole number of zero or more." };
  }
  if (!validateImage(image)) {
    return { ok: false, error: productImageErrorMessage() };
  }

  const sizeResult = parseSizeForCategory(category, body.size);
  if (!sizeResult.ok) return sizeResult;

  return {
    ok: true,
    data: {
      name,
      description,
      price,
      category,
      stock,
      image,
      featured,
      size: sizeResult.size,
    },
  };
}

export function parseSellerProductUpdate(
  body: Record<string, unknown>,
  existing?: { category: Category; size: string | null },
): { ok: true; data: Partial<SellerProductInput> } | { ok: false; error: string } {
  const data: Partial<SellerProductInput> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return { ok: false, error: "Product name cannot be empty." };
    data.name = name;
  }
  if (body.description !== undefined) {
    const description = String(body.description).trim();
    if (!description) return { ok: false, error: "Description cannot be empty." };
    data.description = description;
  }
  if (body.category !== undefined) {
    const category = String(body.category).trim();
    if (!isCategory(category)) return { ok: false, error: "Pick a valid category." };
    data.category = category;
  }
  if (body.image !== undefined) {
    const image = String(body.image).trim();
    if (!validateImage(image)) {
      return { ok: false, error: productImageErrorMessage() };
    }
    data.image = image;
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) {
      return { ok: false, error: "Price must be greater than zero." };
    }
    data.price = price;
  }
  if (body.stock !== undefined) {
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      return { ok: false, error: "Stock must be a whole number of zero or more." };
    }
    data.stock = stock;
  }
  if (body.featured !== undefined) {
    data.featured = Boolean(body.featured);
  }

  if (body.size !== undefined || body.category !== undefined) {
    const category = data.category ?? existing?.category;
    if (!category) {
      return { ok: false, error: "Pick a valid category." };
    }
    const sizeResult = parseSizeForCategory(category, body.size ?? "");
    if (!sizeResult.ok) return sizeResult;
    data.size = sizeResult.size;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "No fields to update." };
  }

  return { ok: true, data };
}

export const sellerCategoryOptions = categories;
