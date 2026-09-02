"use client";

import { useSession } from "next-auth/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { slimProductForCart } from "@/lib/product-mapper";
import { isNativeApp, mobileFetch } from "@/lib/mobile-auth-client";
import type { CartItem, Product } from "@/lib/types";

interface AddItemOptions {
  quantity?: number;
  selectedSize?: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
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

function loadLocalCart(): CartItem[] {
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

function saveLocalCart(items: CartItem[]) {
  const payload: StoredCart = {
    v: STORAGE_VERSION,
    items: items.map((item) => ({
      ...item,
      product: slimProductForCart(item.product),
    })),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function serverLinesToCartItems(
  lines: Array<{
    productId: string;
    quantity: number;
    selectedSize: string | null;
    product: Product;
  }>,
): CartItem[] {
  return lines.map((line) => ({
    product: line.product,
    quantity: line.quantity,
    selectedSize: line.selectedSize ?? undefined,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const isAuthenticated = status === "authenticated" && Boolean(userId);

  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const mergedRef = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!isAuthenticated) {
      setItems(loadLocalCart());
      setIsReady(true);
      mergedRef.current = false;
      return;
    }

    void (async () => {
      const localItems = loadLocalCart();
      if (localItems.length > 0 && !mergedRef.current) {
        mergedRef.current = true;
        const mergeRes = await mobileFetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "merge", items: localItems }),
        });
        if (mergeRes.ok) {
          const data = await mergeRes.json();
          setItems(serverLinesToCartItems(data.items ?? []));
          saveLocalCart([]);
          setIsReady(true);
          return;
        }
      }

      const res = await mobileFetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(serverLinesToCartItems(data.items ?? []));
      } else {
        setItems(localItems);
      }
      setIsReady(true);
    })();
  }, [isAuthenticated, status, userId]);

  useEffect(() => {
    if (!isReady || isAuthenticated) return;
    saveLocalCart(items);
  }, [items, isReady, isAuthenticated]);

  const syncServerLine = useCallback(
    async (
      productId: string,
      quantity: number,
      selectedSize?: string,
    ) => {
      if (!isAuthenticated) return;
      await mobileFetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set",
          productId,
          quantity,
          selectedSize: selectedSize ?? null,
        }),
      });
    },
    [isAuthenticated],
  );

  const addItem = useCallback(
    (product: Product, options?: AddItemOptions) => {
      const quantity = options?.quantity ?? 1;
      const selectedSize = options?.selectedSize;
      const snapshot = slimProductForCart(product);
      setItems((prev) => {
        const existing = prev.find((i) => sameLine(i, product.id, selectedSize));
        const nextQty = existing
          ? Math.min(existing.quantity + quantity, snapshot.stock)
          : Math.min(quantity, snapshot.stock);
        const next = existing
          ? prev.map((i) =>
              sameLine(i, product.id, selectedSize)
                ? { ...i, quantity: nextQty, product: snapshot }
                : i,
            )
          : [
              ...prev,
              {
                product: snapshot,
                quantity: nextQty,
                selectedSize,
              },
            ];
        void syncServerLine(product.id, nextQty, selectedSize);
        return next;
      });
    },
    [syncServerLine],
  );

  const removeItem = useCallback(
    (productId: string, selectedSize?: string) => {
      setItems((prev) =>
        prev.filter((i) => !sameLine(i, productId, selectedSize)),
      );
      void syncServerLine(productId, 0, selectedSize);
    },
    [syncServerLine],
  );

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
      void syncServerLine(productId, quantity, selectedSize);
    },
    [syncServerLine],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    if (isAuthenticated) {
      void mobileFetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
    } else {
      saveLocalCart([]);
    }
  }, [isAuthenticated]);

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

/** Client hint for checkout API (Telebirr/Chapa mobile return URLs). */
export function cartClientHeaders(): Record<string, string> {
  return isNativeApp() ? { "x-sheger-client": "capacitor" } : {};
}
