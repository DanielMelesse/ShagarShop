export type Category =
  | "electronics"
  | "fashion"
  | "home"
  | "sports"
  | "books";

/** Full product for detail/cart pages. */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  featured?: boolean;
  size?: string | null;
  shippingTier: string;
  extraShippingBirr: number;
  condition: string;
  sellerId?: string | null;
}

/** Slim product for grids/search — no description or gallery array. */
export interface ProductListItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  stock: number;
  featured?: boolean;
  size?: string | null;
  shippingTier: string;
  extraShippingBirr: number;
  condition: string;
  sellerId?: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

/** Fields needed in cart UI / shipping totals (not full catalog payload). */
export type CartProductSnapshot = Pick<
  Product,
  | "id"
  | "name"
  | "price"
  | "image"
  | "stock"
  | "category"
  | "size"
  | "shippingTier"
  | "extraShippingBirr"
  | "condition"
  | "rating"
  | "reviewCount"
  | "sellerId"
>;
