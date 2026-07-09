import {
  getDepartmentProductCategory,
  getSellerDepartmentOptions,
  isSellerDepartmentSlug,
} from "@/lib/departments";
import { calculateListedProductPrice, categoryNeedsSize, getSizeOptions } from "@/lib/products";
import {
  isValidProductImage,
  MAX_PRODUCT_IMAGES,
  productImageErrorMessage,
  productImagesErrorMessage,
} from "@/lib/product-image";
import { isProductCondition, type ProductCondition } from "@/lib/product-condition";
import { isShippingTier, type ShippingTier } from "@/lib/shipping";

export interface SellerProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  images: string[];
  featured?: boolean;
  size?: string | null;
  shippingTier: ShippingTier;
  extraShippingBirr: number;
  condition: ProductCondition;
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

function parseProductImages(
  body: Record<string, unknown>,
): { ok: true; images: string[] } | { ok: false; error: string } {
  const rawValues = Array.isArray(body.images)
    ? body.images
    : body.image !== undefined
      ? [body.image]
      : [];

  const images = rawValues
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (images.length === 0) {
    return { ok: false, error: productImagesErrorMessage() };
  }

  if (images.length > MAX_PRODUCT_IMAGES) {
    return {
      ok: false,
      error: `You can add up to ${MAX_PRODUCT_IMAGES} images per product.`,
    };
  }

  for (const image of images) {
    if (!isValidProductImage(image)) {
      return { ok: false, error: productImageErrorMessage() };
    }
  }

  return { ok: true, images };
}

function parseSizeForDepartment(
  departmentSlug: string,
  raw: unknown,
): { ok: true; size: string | null } | { ok: false; error: string } {
  const size = String(raw ?? "").trim();
  const sizeCategory = getDepartmentProductCategory(departmentSlug);

  if (!sizeCategory || !categoryNeedsSize(sizeCategory)) {
    return { ok: true, size: null };
  }

  if (!size) {
    return { ok: false, error: "Size is required for fashion and sports." };
  }

  const allowed = getSizeOptions(sizeCategory);
  if (!allowed.includes(size)) {
    return { ok: false, error: "Pick a valid size for this category." };
  }

  return { ok: true, size };
}

function parseShippingTier(
  body: Record<string, unknown>,
): { ok: true; shippingTier: ShippingTier } | { ok: false; error: string } {
  const shippingTier = String(body.shippingTier ?? "standard").trim();

  if (!isShippingTier(shippingTier)) {
    return { ok: false, error: "Pick a valid shipping size." };
  }

  return { ok: true, shippingTier };
}

function parseProductConditionField(
  body: Record<string, unknown>,
): { ok: true; condition: ProductCondition } | { ok: false; error: string } {
  const condition = String(body.condition ?? "new").trim();

  if (!isProductCondition(condition)) {
    return { ok: false, error: "Pick a valid product condition." };
  }

  return { ok: true, condition };
}

export function parseSellerProductInput(
  body: Record<string, unknown>,
): { ok: true; data: SellerProductInput } | { ok: false; error: string } {
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const category = String(body.category ?? "").trim();
  const price = Number(body.price);
  const stock = Number(body.stock);
  const featured = Boolean(body.featured);

  if (!name) return { ok: false, error: "Product name is required." };
  if (!description) return { ok: false, error: "Description is required." };
  if (!isSellerDepartmentSlug(category)) {
    return { ok: false, error: "Pick a valid department." };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, error: "Price must be greater than zero." };
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return { ok: false, error: "Stock must be a whole number of zero or more." };
  }

  const imagesResult = parseProductImages(body);
  if (!imagesResult.ok) return imagesResult;

  const sizeResult = parseSizeForDepartment(category, body.size);
  if (!sizeResult.ok) return sizeResult;

  const shippingResult = parseShippingTier(body);
  if (!shippingResult.ok) return shippingResult;

  const conditionResult = parseProductConditionField(body);
  if (!conditionResult.ok) return conditionResult;

  const { images } = imagesResult;

  return {
    ok: true,
    data: {
      name,
      description,
      price: calculateListedProductPrice(price),
      category,
      stock,
      image: images[0],
      images,
      featured,
      size: sizeResult.size,
      shippingTier: shippingResult.shippingTier,
      extraShippingBirr: 0,
      condition: conditionResult.condition,
    },
  };
}

export function parseSellerProductUpdate(
  body: Record<string, unknown>,
  existing?: { category: string; size: string | null },
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
    if (!isSellerDepartmentSlug(category)) {
      return { ok: false, error: "Pick a valid department." };
    }
    data.category = category;
  }
  if (body.images !== undefined || body.image !== undefined) {
    const imagesResult = parseProductImages(body);
    if (!imagesResult.ok) return imagesResult;
    data.images = imagesResult.images;
    data.image = imagesResult.images[0];
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) {
      return { ok: false, error: "Price must be greater than zero." };
    }
    data.price = calculateListedProductPrice(price);
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
  if (body.shippingTier !== undefined) {
    const shippingResult = parseShippingTier(body);
    if (!shippingResult.ok) return shippingResult;
    data.shippingTier = shippingResult.shippingTier;
    data.extraShippingBirr = 0;
  }
  if (body.condition !== undefined) {
    const conditionResult = parseProductConditionField(body);
    if (!conditionResult.ok) return conditionResult;
    data.condition = conditionResult.condition;
  }

  if (body.size !== undefined || body.category !== undefined) {
    const category = data.category ?? existing?.category;
    if (!category || !isSellerDepartmentSlug(category)) {
      return { ok: false, error: "Pick a valid department." };
    }
    const sizeResult = parseSizeForDepartment(category, body.size ?? "");
    if (!sizeResult.ok) return sizeResult;
    data.size = sizeResult.size;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "No fields to update." };
  }

  return { ok: true, data };
}

export const sellerDepartmentOptions = getSellerDepartmentOptions();
