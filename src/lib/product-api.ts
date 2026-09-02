import { appBaseUrl } from "@/lib/chapa";
import { productImageServeUrl } from "@/lib/product-image";
import { toProduct, toProductListItem } from "@/lib/product-mapper";
import type { Product, ProductListItem } from "@/lib/types";

export const MOBILE_PRODUCT_PAGE_SIZE = 20;

function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = appBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function withAbsoluteProductImages<T extends { image: string }>(
  item: T,
): T {
  const served = productImageServeUrl(item.image, "card");
  return {
    ...item,
    image: absoluteUrl(served),
  };
}

export function serializeProductListItem(item: ProductListItem): ProductListItem {
  return withAbsoluteProductImages(item);
}

export function serializeProduct(product: Product): Product {
  return {
    ...product,
    image: absoluteUrl(productImageServeUrl(product.image, "gallery")),
    images: product.images.map((img) =>
      absoluteUrl(productImageServeUrl(img, "gallery")),
    ),
  };
}

export { toProduct, toProductListItem };
