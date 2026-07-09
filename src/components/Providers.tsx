"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { LocaleProvider } from "@/context/LocaleContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>
        <CartProvider>{children}</CartProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
