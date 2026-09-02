"use client";

import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { MobileShell } from "@/components/MobileShell";
import { PushRegister } from "@/components/PushRegister";
import { CartProvider } from "@/context/CartContext";
import { LocaleProvider } from "@/context/LocaleContext";

export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      <LocaleProvider>
        <CartProvider>
          <MobileShell />
          <PushRegister />
          {children}
        </CartProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
