"use client";

import { ProductImage } from "@/components/ProductImage";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { categories, categoryNeedsSize, formatPrice, getSizeOptions } from "@/lib/products";
import type { Category, Product } from "@/lib/types";

interface SellerUser {
  id: string;
  name: string;
  phone: string;
}

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  category: Category;
  stock: string;
  image: string;
  size: string;
  featured: boolean;
}

const emptyForm = (): ProductFormState => ({
  name: "",
  description: "",
  price: "",
  category: "home",
  stock: "",
  image: "",
  size: "",
  featured: false,
});

function formFromProduct(product: Product): ProductFormState {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    category: product.category,
    stock: String(product.stock),
    image: product.image,
    size: product.size ?? "",
    featured: product.featured ?? false,
  };
}

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

async function uploadProductImage(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/seller/upload", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error ?? "Could not upload image." };
  }
  return { ok: true, url: data.url };
}

function ProductImageField({
  image,
  onChange,
  inputId,
}: {
  image: string;
  onChange: (url: string) => void;
  inputId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(file: File | null) {
    if (!file) return;
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
    onChange(result.url);
  }

  useEffect(() => {
    if (!image.startsWith("/uploads/")) {
      setFileName("");
    }
  }, [image]);

  return (
    <div className="sm:col-span-2">
      <p className="text-sm font-medium text-zinc-700">Product image</p>
      <p className="mt-0.5 text-xs text-zinc-500">
        Upload a file (JPEG, PNG, WebP, or GIF, max 5 MB) or paste an image URL.
      </p>

      <div className="mt-3 grid gap-4 sm:grid-cols-[auto,1fr]">
        <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
          {image ? (
            <ProductImage
              src={image}
              alt="Product preview"
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-400">
              No image
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-xs font-medium text-zinc-600">Upload file</span>
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
            {uploadError && (
              <p className="mt-1 text-xs text-red-600">{uploadError}</p>
            )}
          </div>

          <div>
            <label htmlFor={`${inputId}-url`} className="text-xs font-medium text-zinc-600">
              Or image URL
            </label>
            <input
              id={`${inputId}-url`}
              type="url"
              placeholder="https://..."
              value={image.startsWith("/uploads/") ? "" : image}
              onChange={(e) => onChange(e.target.value)}
              className={inputClass}
            />
          </div>

          {image && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-700"
            >
              Remove image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  formId = "product",
}: {
  initial: ProductFormState;
  submitLabel: string;
  onSubmit: (data: ProductFormState) => Promise<{ ok: boolean; error?: string }>;
  onCancel?: () => void;
  formId?: string;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(initial);
    setError("");
  }, [initial]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.image.trim()) {
      setError("Add an image file or URL.");
      return;
    }
    if (categoryNeedsSize(form.category) && !form.size.trim()) {
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
    if (!onCancel) {
      setForm(emptyForm());
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="text-sm font-medium text-zinc-700">
            Product name
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className="text-sm font-medium text-zinc-700">
            Description
          </label>
          <textarea
            id="description"
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="price" className="text-sm font-medium text-zinc-700">
            Price (Birr)
          </label>
          <input
            id="price"
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
          <label htmlFor="stock" className="text-sm font-medium text-zinc-700">
            Stock
          </label>
          <input
            id="stock"
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
          <label htmlFor="category" className="text-sm font-medium text-zinc-700">
            Category
          </label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => {
              const category = e.target.value as Category;
              setForm((f) => ({
                ...f,
                category,
                size: categoryNeedsSize(category) ? f.size : "",
              }));
            }}
            className={inputClass}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        {categoryNeedsSize(form.category) && (
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
              {getSizeOptions(form.category).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
        <ProductImageField
          inputId={formId}
          image={form.image}
          onChange={(url) => setForm((f) => ({ ...f, image: url }))}
        />
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="featured"
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="featured" className="text-sm text-zinc-700">
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

export function SellerDashboard({ user }: { user: SellerUser }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/seller/products");
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function createProduct(form: ProductFormState) {
    const res = await fetch("/api/seller/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        stock: Number(form.stock),
        image: form.image,
        size: form.size,
        featured: form.featured,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Could not create product." };
    }
    setProducts((prev) => [...prev, data.product].sort((a, b) => a.name.localeCompare(b.name)));
    setMessage("Product listed successfully.");
    return { ok: true };
  }

  async function updateProduct(id: string, form: ProductFormState) {
    const res = await fetch(`/api/seller/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        stock: Number(form.stock),
        image: form.image,
        size: form.size,
        featured: form.featured,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Could not update product." };
    }
    setProducts((prev) =>
      prev
        .map((p) => (p.id === id ? data.product : p))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    setEditingId(null);
    setMessage("Product updated.");
    return { ok: true };
  }

  async function deleteProduct(product: Product) {
    if (
      !window.confirm(
        `Delete "${product.name}"? This cannot be undone if the product has no orders.`,
      )
    ) {
      return;
    }

    const res = await fetch(`/api/seller/products/${product.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error ?? "Could not delete product.");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    if (editingId === product.id) setEditingId(null);
    setMessage("Product deleted.");
  }

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const featuredCount = products.filter((p) => p.featured).length;
  const editingProduct = editingId ? products.find((p) => p.id === editingId) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Seller dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {user.name} · {user.phone}
          </p>
        </div>
        <Link
          href="/shop"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          View shop →
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Listings", value: products.length },
          { label: "Units in stock", value: totalStock },
          { label: "Featured", value: featuredCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {message && (
        <p className="mt-6 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {message}
        </p>
      )}

      <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Add a product</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Upload an image from your device or paste a public image URL.
        </p>
        <div className="mt-6">
          <ProductForm
            formId="add-product"
            initial={emptyForm()}
            submitLabel="List product"
            onSubmit={createProduct}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900">Your listings</h2>

        {loading ? (
          <div className="mt-6 h-32 animate-pulse rounded-2xl bg-zinc-200" />
        ) : products.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
            No products yet. Add your first listing above.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {products.map((product) => (
              <li
                key={product.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                {editingId === product.id && editingProduct ? (
                  <div>
                    <h3 className="font-semibold text-zinc-900">Edit listing</h3>
                    <div className="mt-4">
                      <ProductForm
                        formId={`edit-${product.id}`}
                        initial={formFromProduct(editingProduct)}
                        submitLabel="Save changes"
                        onSubmit={(form) => updateProduct(product.id, form)}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-zinc-900">{product.name}</h3>
                        {product.featured && (
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                            Featured
                          </span>
                        )}
                        {product.stock === 0 && (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                            Out of stock
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                        {product.description}
                      </p>
                      <p className="mt-2 text-sm text-zinc-500">
                        {formatPrice(product.price)} · {product.stock} in stock ·{" "}
                        {categories.find((c) => c.id === product.category)?.label ??
                          product.category}
                        {product.size ? ` · Size ${product.size}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={`/product/${product.id}`}
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(product.id);
                          setMessage("");
                        }}
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
