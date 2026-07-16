"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable, EmptyState, Td, Th } from "@/components/admin/AdminTable";
import type { AdminCustomerRow } from "@/lib/admin";

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/customers", { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load customers.");
          return;
        }
        setCustomers(data.customers ?? []);
      })
      .catch(() => setError("Could not load customers."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      title="Customers"
      description="All accounts on the platform (Shopify-style customer directory)."
    >
      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
      ) : customers.length === 0 ? (
        <EmptyState message="No users yet." />
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Orders</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-zinc-100">
                <Td className="font-medium text-zinc-900">{customer.name}</Td>
                <Td>{customer.phone}</Td>
                <Td>{customer.email ?? "—"}</Td>
                <Td>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                    {customer.role}
                  </span>
                </Td>
                <Td>{customer.orderCount}</Td>
                <Td>
                  {new Date(customer.createdAt).toLocaleDateString(undefined, {
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
