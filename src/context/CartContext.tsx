"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { slimProductForCart } from "@/lib/product-mapper";
import type { CartItem, Product } from "@/lib/types";

interface AddItemOptions {
  quantity?: number;
  selectedSize?: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  /** False until localStorage has been read on the client. */
  isReady: boolean;
  addItem: (product: Product, options?: AddItemOptions) => void;
  removeItem: (productId: string, selectedSize?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    selectedSize?: string,
  ) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "sheger-cart";
const STORAGE_VERSION = 2;

type StoredCart = {
  v: number;
  items: CartItem[];
};

function sameLine(
  item: CartItem,
  productId: string,
  selectedSize?: string,
): boolean {
  return item.product.id === productId && item.selectedSize === selectedSize;
}

function normalizeStoredItem(raw: CartItem): CartItem | null {
  if (!raw?.product?.id) return null;
  return {
    quantity: Math.max(1, raw.quantity || 1),
    selectedSize: raw.selectedSize,
    product: slimProductForCart(raw.product as Product),
  };
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredCart | CartItem[];
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.items)
        ? parsed.items
        : [];
    return list
      .map(normalizeStoredItem)
      .filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const payload: StoredCart = {
      v: STORAGE_VERSION,
      items: items.map((item) => ({
        ...item,
        product: slimProductForCart(item.product),
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [items, isReady]);

  const addItem = useCallback((product: Product, options?: AddItemOptions) => {
    const quantity = options?.quantity ?? 1;
    const selectedSize = options?.selectedSize;
    const snapshot = slimProductForCart(product);
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, product.id, selectedSize));
      if (existing) {
        return prev.map((i) =>
          sameLine(i, product.id, selectedSize)
            ? {
                ...i,
                quantity: Math.min(i.quantity + quantity, snapshot.stock),
                product: snapshot,
              }
            : i,
        );
      }
      return [
        ...prev,
        {
          product: snapshot,
          quantity: Math.min(quantity, snapshot.stock),
          selectedSize,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: string, selectedSize?: string) => {
    setItems((prev) =>
      prev.filter((i) => !sameLine(i, productId, selectedSize)),
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, selectedSize?: string) => {
      setItems((prev) =>
        prev
          .map((i) => {
            if (!sameLine(i, productId, selectedSize)) return i;
            if (quantity <= 0) return null;
            return {
              ...i,
              quantity: Math.min(quantity, i.product.stock),
            };
          })
          .filter((i): i is CartItem => i !== null),
      );
    },
    [],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      isReady,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, itemCount, subtotal, isReady, addItem, removeItem, updateQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
