"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/context/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import {
  ACCOUNT_HOME,
  ACCOUNT_ORDERS,
  ACCOUNT_PROFILE,
  ACCOUNT_SHOP,
} from "@/lib/account-routes";
import { isSellerRole } from "@/lib/user-role";
import { SELLER_HOME } from "@/lib/seller-routes";

const baseLinkKeys = [
  { href: ACCOUNT_HOME, labelKey: "account.overview" },
  { href: ACCOUNT_PROFILE, labelKey: "account.profileSecurity" },
  { href: ACCOUNT_ORDERS, labelKey: "account.ordersNav" },
] as const;

export function AccountNav() {
  const pathname = usePathname();
  const { t } = useTranslations();
  const { user } = useAuth();
  const isSeller = isSellerRole(user?.role);

  const links = isSeller
    ? [
        ...baseLinkKeys,
        { href: ACCOUNT_SHOP, labelKey: "account.shopSettings" as const },
        { href: SELLER_HOME, labelKey: "account.sellerDashboard" as const },
      ]
    : baseLinkKeys;

  return (
    <nav aria-label="Account" className="space-y-1">
      {links.map((link) => {
        const active =
          link.href === ACCOUNT_HOME
            ? pathname === ACCOUNT_HOME
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        const isExternalSeller = link.href === SELLER_HOME;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-brand-600 text-white"
                : isExternalSeller
                  ? "text-brand-700 hover:bg-brand-50"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {t(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

interface AccountShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AccountShell({ title, description, children }: AccountShellProps) {
  const { user } = useAuth();
  const { t } = useTranslations();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header>
        <p className="text-sm font-medium text-brand-700">{t("account.myAccount")}</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {description ?? `${user?.name} · ${user?.phone}`}
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
          <AccountNav />
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
