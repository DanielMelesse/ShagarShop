export type Category =
  | "electronics"
  | "fashion"
  | "home"
  | "sports"
  | "books";

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
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}
