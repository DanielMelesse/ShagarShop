"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AccountShell } from "@/components/account/AccountShell";
import {
  fetchAccount,
  updateAccountPassword,
  updateAccountProfile,
} from "@/lib/account-client";

export function AccountProfile() {
  const { update: refreshSession } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchAccount();
    if (!result.ok) {
      setProfileError(result.error);
      setLoading(false);
      return;
    }
    setName(result.account.user.name);
    setEmail(result.account.user.email ?? "");
    setPhone(result.account.user.phone);
    setRole(result.account.user.role);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleProfileSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    setProfileError("");

    const result = await updateAccountProfile({ name, email });
    setSavingProfile(false);

    if (!result.ok) {
      setProfileError(result.error);
      return;
    }

    setProfileMessage("Profile updated.");
    await refreshSession();
  }

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMessage("");
    setPasswordError("");

    const form = new FormData(e.currentTarget);
    const result = await updateAccountPassword({
      currentPassword: String(form.get("currentPassword") ?? ""),
      newPassword: String(form.get("newPassword") ?? ""),
    });
    setSavingPassword(false);

    if (!result.ok) {
      setPasswordError(result.error);
      return;
    }

    setPasswordMessage("Password updated.");
    e.currentTarget.reset();
  }

  return (
    <AccountShell
      title="Profile & security"
      description="Update your personal details and password."
    >
      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
      ) : (
        <div className="space-y-6">
          <form
            onSubmit={(e) => void handleProfileSubmit(e)}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-zinc-900">Personal details</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Account type: {role === "SELLER" ? "Seller" : "Shopper"}
            </p>

            <div className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-700">Full name</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-700">Phone</span>
                <input
                  readOnly
                  value={phone}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-500"
                />
                <span className="mt-1 block text-xs text-zinc-400">
                  Phone is your login ID and cannot be changed here.
                </span>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-700">Email (optional)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm"
                />
              </label>
            </div>

            {profileError && (
              <p className="mt-4 text-sm text-red-600">{profileError}</p>
            )}
            {profileMessage && (
              <p className="mt-4 text-sm text-brand-700">{profileMessage}</p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="mt-6 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {savingProfile ? "Saving…" : "Save profile"}
            </button>
          </form>

          <form
            onSubmit={(e) => void handlePasswordSubmit(e)}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-zinc-900">Change password</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Use at least 6 characters for your new password.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-700">Current password</span>
                <input
                  required
                  type="password"
                  name="currentPassword"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-700">New password</span>
                <input
                  required
                  type="password"
                  name="newPassword"
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm"
                />
              </label>
            </div>

            {passwordError && (
              <p className="mt-4 text-sm text-red-600">{passwordError}</p>
            )}
            {passwordMessage && (
              <p className="mt-4 text-sm text-brand-700">{passwordMessage}</p>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="mt-6 rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
            >
              {savingPassword ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      )}
    </AccountShell>
  );
}
