"use client";

import { FormEvent, useRef, useState } from "react";
import {
  departmentNeedsSize,
  getDepartmentProductCategory,
  getSellerDepartmentOptions,
  legacyCategoryToDepartmentSlug,
} from "@/lib/departments";
import { getSizeOptions, sellerPriceFromListed } from "@/lib/products";
import {
  SHIPPING_TIER_FEES,
  SHIPPING_TIER_LABELS,
  SHIPPING_TIERS,
} from "@/lib/shipping";
import { PRODUCT_CONDITION_OPTIONS } from "@/lib/product-condition";
import { MAX_PRODUCT_IMAGES } from "@/lib/product-image";
import type { Product } from "@/lib/types";

const sellerDepartments = getSellerDepartmentOptions();

export interface ProductFormState {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  images: string[];
  size: string;
  featured: boolean;
  shippingTier: string;
  condition: string;
}

export const emptyProductForm = (): ProductFormState => ({
  name: "",
  description: "",
  price: "",
  category: "home-kitchen",
  stock: "",
  images: [],
  size: "",
  featured: false,
  shippingTier: "standard",
  condition: "new",
});

export function productToFormState(product: Product): ProductFormState {
  return {
    name: product.name,
    description: product.description,
    price: String(sellerPriceFromListed(product.price)),
    category: legacyCategoryToDepartmentSlug(product.category),
    stock: String(product.stock),
    images: product.images.length > 0 ? product.images : product.image ? [product.image] : [],
    size: product.size ?? "",
    featured: product.featured ?? false,
    shippingTier: product.shippingTier ?? "standard",
    condition: product.condition ?? "new",
  };
}

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

async function uploadProductImage(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/seller/upload", { method: "POST", credentials: "same-origin", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error ?? "Could not upload image." };
  }
  return { ok: true, url: data.url };
}

function ProductImagesField({
  images,
  onChange,
  inputId,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  inputId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fileName, setFileName] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canAddMore = images.length < MAX_PRODUCT_IMAGES;

  async function addImage(url: string) {
    const trimmed = url.trim();
    if (!trimmed || !canAddMore) return;
    if (images.includes(trimmed)) {
      setUploadError("This image is already added.");
      return;
    }
    onChange([...images, trimmed]);
    setUrlDraft("");
    setUploadError("");
    setFileName("");
  }

  async function handleFileChange(file: File | null) {
    if (!file || !canAddMore) return;
    setFileName(file.name);
    setUploadError("");
    setUploading(true);
    const result = await uploadProductImage(file);
    setUploading(false);
    if (!result.ok) {
      setUploadError(result.error);
      setFileName("");
      return;
    }
    await addImage(result.url);
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
    setUploadError("");
  }

  return (
    <div className="sm:col-span-2">
      <p className="text-sm font-medium text-zinc-700">Product images</p>
      <p className="mt-0.5 text-xs text-zinc-500">
        Add up to {MAX_PRODUCT_IMAGES} images. The first image is the cover shown in search
        and listings.
      </p>

      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className="relative">
              <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                {/* Plain img: next/image can cache a 404 if public/ uploads lag in production. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`Product image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow hover:bg-red-700"
                aria-label={`Remove image ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <div className="mt-4 space-y-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-4">
          <div>
            <span className="text-xs font-medium text-zinc-600">
              Upload file ({images.length}/{MAX_PRODUCT_IMAGES})
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                id={`${inputId}-file`}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  void handleFileChange(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Uploading…" : "Choose file"}
              </button>
              {fileName && !uploading && (
                <span className="max-w-[200px] truncate text-xs text-zinc-500">
                  {fileName}
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor={`${inputId}-url`} className="text-xs font-medium text-zinc-600">
              Or image URL
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              <input
                id={`${inputId}-url`}
                type="url"
                placeholder="https://..."
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void addImage(urlDraft);
                  }
                }}
                className={inputClass}
              />
              <button
                type="button"
                disabled={!urlDraft.trim()}
                onClick={() => void addImage(urlDraft)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add URL
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
    </div>
  );
}

export function SellerProductForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  formId = "product",
  resetOnSuccess = false,
}: {
  initial: ProductFormState;
  submitLabel: string;
  onSubmit: (data: ProductFormState) => Promise<{ ok: boolean; error?: string }>;
  onCancel?: () => void;
  formId?: string;
  resetOnSuccess?: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (form.images.length === 0) {
      setError("Add at least one product image.");
      return;
    }
    if (form.images.length > MAX_PRODUCT_IMAGES) {
      setError(`You can add up to ${MAX_PRODUCT_IMAGES} images per product.`);
      return;
    }
    if (departmentNeedsSize(form.category) && !form.size.trim()) {
      setError("Size is required for fashion and sports.");
      return;
    }
    setLoading(true);
    const result = await onSubmit(form);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    if (resetOnSuccess) {
      setForm(emptyProductForm());
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${formId}-name`} className="text-sm font-medium text-zinc-700">
            Product name
          </label>
          <input
            id={`${formId}-name`}
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${formId}-description`} className="text-sm font-medium text-zinc-700">
            Description
          </label>
          <textarea
            id={`${formId}-description`}
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${formId}-condition`} className="text-sm font-medium text-zinc-700">
            Listing type
          </label>
          <select
            id={`${formId}-condition`}
            required
            value={form.condition}
            onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
            className={inputClass}
          >
            {PRODUCT_CONDITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${formId}-price`} className="text-sm font-medium text-zinc-700">
            Price (Birr)
          </label>
          <input
            id={`${formId}-price`}
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${formId}-stock`} className="text-sm font-medium text-zinc-700">
            Stock
          </label>
          <input
            id={`${formId}-stock`}
            type="number"
            min="0"
            step="1"
            required
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${formId}-category`} className="text-sm font-medium text-zinc-700">
            Primary category
          </label>
          <select
            id={`${formId}-category`}
            value={form.category}
            onChange={(e) => {
              const category = e.target.value;
              setForm((f) => ({
                ...f,
                category,
                size: departmentNeedsSize(category) ? f.size : "",
              }));
            }}
            className={inputClass}
          >
            {sellerDepartments.map((department) => (
              <option key={department.value} value={department.value}>
                {department.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${formId}-shipping-tier`} className="text-sm font-medium text-zinc-700">
            Shipping size
          </label>
          <select
            id={`${formId}-shipping-tier`}
            value={form.shippingTier}
            onChange={(e) => setForm((f) => ({ ...f, shippingTier: e.target.value }))}
            className={inputClass}
          >
            {SHIPPING_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {SHIPPING_TIER_LABELS[tier]}
                {SHIPPING_TIER_FEES[tier] > 0
                  ? ` (+${SHIPPING_TIER_FEES[tier]} Birr per unit)`
                  : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500">
            Large and oversized items add per-unit shipping at checkout. Orders of 3+ or 5+ items
            also include a bulk surcharge.
          </p>
        </div>
        {departmentNeedsSize(form.category) && (
          <div>
            <label htmlFor={`${formId}-size`} className="text-sm font-medium text-zinc-700">
              Size
            </label>
            <select
              id={`${formId}-size`}
              required
              value={form.size}
              onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
              className={inputClass}
            >
              <option value="">Select size</option>
              {(getDepartmentProductCategory(form.category)
                ? getSizeOptions(getDepartmentProductCategory(form.category)!)
                : []
              ).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
        <ProductImagesField
          inputId={formId}
          images={form.images}
          onChange={(images) => setForm((f) => ({ ...f, images }))}
        />
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id={`${formId}-featured`}
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor={`${formId}-featured`} className="text-sm text-zinc-700">
            Feature in Today&apos;s Deals
          </label>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
