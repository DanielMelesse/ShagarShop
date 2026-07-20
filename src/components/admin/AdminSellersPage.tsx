"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable, EmptyState, Td, Th } from "@/components/admin/AdminTable";
import type { AdminSellerRow } from "@/lib/admin";
import { adminSellerHref } from "@/lib/admin-routes";

export function AdminSellersPage() {
  const [sellers, setSellers] = useState<AdminSellerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/sellers", { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load sellers.");
          return;
        }
        setSellers(data.sellers ?? []);
      })
      .catch(() => setError("Could not load sellers."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      title="Sellers"
      description="Marketplace vendors — click a shop for catalog, stock, and revenue."
    >
      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
      ) : sellers.length === 0 ? (
        <EmptyState message="No sellers registered yet." />
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <Th>Shop</Th>
              <Th>Owner</Th>
              <Th>Location</Th>
              <Th>Category</Th>
              <Th>Listings</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((seller) => (
              <tr
                key={seller.id}
                className="border-t border-zinc-100 transition hover:bg-zinc-50"
              >
                <Td className="font-medium text-zinc-900">
                  <Link
                    href={adminSellerHref(seller.id)}
                    className="text-brand-700 hover:underline"
                  >
                    {seller.shopName}
                  </Link>
                </Td>
                <Td>
                  <Link
                    href={adminSellerHref(seller.id)}
                    className="block text-zinc-600"
                  >
                    {seller.ownerName}
                    <div className="text-xs text-zinc-400">{seller.ownerPhone}</div>
                  </Link>
                </Td>
                <Td>
                  <Link
                    href={adminSellerHref(seller.id)}
                    className="block text-zinc-600"
                  >
                    {seller.location}
                  </Link>
                </Td>
                <Td>
                  <Link
                    href={adminSellerHref(seller.id)}
                    className="block capitalize text-zinc-600"
                  >
                    {seller.category}
                  </Link>
                </Td>
                <Td>
                  <Link
                    href={adminSellerHref(seller.id)}
                    className="block text-zinc-600"
                  >
                    {seller.listings}
                  </Link>
                </Td>
                <Td>
                  <Link
                    href={adminSellerHref(seller.id)}
                    className="block text-zinc-600"
                  >
                    {new Date(seller.completedAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </AdminShell>
  );
}
