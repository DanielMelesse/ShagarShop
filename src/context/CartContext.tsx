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

function sameLine(
  item: CartItem,
  productId: string,
  selectedSize?: string,
): boolean {
  return item.product.id === productId && item.selectedSize === selectedSize;
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
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
    if (isReady) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isReady]);

  const addItem = useCallback((product: Product, options?: AddItemOptions) => {
    const quantity = options?.quantity ?? 1;
    const selectedSize = options?.selectedSize;
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, product.id, selectedSize));
      if (existing) {
        return prev.map((i) =>
          sameLine(i, product.id, selectedSize)
            ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
            : i,
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: Math.min(quantity, product.stock),
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
