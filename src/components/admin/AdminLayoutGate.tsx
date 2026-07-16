"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isAdminRole } from "@/lib/user-role";

function AdminSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
      <div className="mt-8 h-40 animate-pulse rounded-2xl bg-zinc-100" />
    </div>
  );
}

export function AdminLayoutGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isAdminRole(user.role)) {
      router.replace("/");
    }
  }, [isReady, user, router, pathname]);

  if (!isReady || !user || !isAdminRole(user.role)) {
    return <AdminSkeleton />;
  }

  return <>{children}</>;
}
