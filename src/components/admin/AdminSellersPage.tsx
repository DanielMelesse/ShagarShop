"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable, EmptyState, Td, Th } from "@/components/admin/AdminTable";
import type { AdminSellerRow } from "@/lib/admin";

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
      description="Marketplace vendors — shops, categories, and listing counts."
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
              <tr key={seller.id} className="border-t border-zinc-100">
                <Td className="font-medium text-zinc-900">{seller.shopName}</Td>
                <Td>
                  {seller.ownerName}
                  <div className="text-xs text-zinc-400">{seller.ownerPhone}</div>
                </Td>
                <Td>{seller.location}</Td>
                <Td className="capitalize">{seller.category}</Td>
                <Td>{seller.listings}</Td>
                <Td>
                  {new Date(seller.completedAt).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </AdminShell>
  );
}
