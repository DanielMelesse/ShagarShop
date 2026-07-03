import type { ProductFormState } from "@/components/seller/SellerProductForm";
import type { Product } from "@/lib/types";

function formPayload(form: ProductFormState) {
  return {
    name: form.name,
    description: form.description,
    price: Number(form.price),
    category: form.category,
    stock: Number(form.stock),
    images: form.images,
    size: form.size,
    featured: form.featured,
    shippingTier: form.shippingTier,
    extraShippingBirr: form.extraShippingBirr ? Number(form.extraShippingBirr) : 0,
  };
}

export async function fetchSellerProducts(): Promise<{
  ok: true;
  products: Product[];
} | { ok: false; error: string }> {
  const res = await fetch("/api/seller/products", { credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error:
        typeof data.error === "string"
          ? data.error
          : "Could not load your products. Try logging in again.",
    };
  }
  return { ok: true, products: data.products ?? [] };
}

export async function fetchSellerProduct(
  id: string,
): Promise<{ ok: true; product: Product } | { ok: false; error: string }> {
  const res = await fetch(`/api/seller/products/${id}`, { credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.error === "string" ? data.error : "Product not found.",
    };
  }
  return { ok: true, product: data.product };
}

export async function createSellerProduct(
  form: ProductFormState,
): Promise<{ ok: true; product: Product } | { ok: false; error: string }> {
  const res = await fetch("/api/seller/products", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formPayload(form)),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error ?? "Could not create product." };
  }
  return { ok: true, product: data.product };
}

export async function updateSellerProduct(
  id: string,
  form: ProductFormState,
): Promise<{ ok: true; product: Product } | { ok: false; error: string }> {
  const res = await fetch(`/api/seller/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formPayload(form)),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error ?? "Could not update product." };
  }
  return { ok: true, product: data.product };
}

export async function deleteSellerProduct(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error ?? "Could not delete product." };
  }
  return { ok: true };
}

export async function fetchSellerShopName(): Promise<string | null> {
  const res = await fetch("/api/seller/register/status", { credentials: "same-origin" });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data.profile?.shopName ?? null;
}
