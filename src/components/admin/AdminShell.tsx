"use client";

import { AdminNav } from "@/components/admin/AdminNav";

interface AdminShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AdminShell({ title, description, children }: AdminShellProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          ShegerShop Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        )}
      </header>
      <AdminNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
