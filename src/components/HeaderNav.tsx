"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "@/context/LocaleContext";
import { ALL_DEPARTMENTS_HREF } from "@/lib/departments";
import { isAdminAppPath } from "@/lib/admin-routes";
import { isDeliveryAppPath } from "@/lib/delivery-routes";
import { isSellerAppPath } from "@/lib/seller-routes";
import { isTodaysDealsPath, TODAYS_DEALS_HREF } from "@/lib/shop-routes";
import { useMounted } from "@/hooks/useMounted";

const navLinkClass =
  "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900";

const navLinkActiveClass =
  "whitespace-nowrap rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white";

function HeaderNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mounted = useMounted();
  const { t } = useTranslations();

  const onSellerSurface =
    pathname.startsWith("/sell") || isSellerAppPath(pathname);
  const onDeliverySurface =
    pathname.startsWith("/deliver") || isDeliveryAppPath(pathname);
  const onAdminSurface = isAdminAppPath(pathname);

  if (onSellerSurface || onDeliverySurface || onAdminSurface) {
    return null;
  }

  const featured = searchParams.get("featured") === "1";
  const allDepartmentsActive =
    mounted &&
    (pathname === ALL_DEPARTMENTS_HREF || pathname.startsWith("/shop/department/"));
  const dealsActive = mounted && isTodaysDealsPath(pathname, featured);

  return (
    <nav
      aria-label={t("nav.shop")}
      className="border-b border-zinc-200 bg-white shadow-sm shadow-zinc-900/5"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 sm:gap-2 sm:px-6">
        <Link
          href={ALL_DEPARTMENTS_HREF}
          className={allDepartmentsActive ? navLinkActiveClass : navLinkClass}
        >
          {t("nav.allDepartments")}
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:gap-2">
          <Link
            href={TODAYS_DEALS_HREF}
            className={dealsActive ? navLinkActiveClass : navLinkClass}
          >
            {t("nav.todaysDeals")}
          </Link>

          <Link
            href="/sell"
            className={pathname.startsWith("/sell") ? navLinkActiveClass : navLinkClass}
          >
            {t("nav.seller")}
          </Link>

          <Link
            href="/customer-service"
            className={
              pathname === "/customer-service" ? navLinkActiveClass : navLinkClass
            }
          >
            {t("nav.customerService")}
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeaderNavFallback() {
  const { t } = useTranslations();

  return (
    <nav
      aria-label={t("nav.shop")}
      className="border-b border-zinc-200 bg-white shadow-sm shadow-zinc-900/5"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6">
        <span className={navLinkClass}>{t("nav.allDepartments")}</span>
        <span className={navLinkClass}>{t("nav.todaysDeals")}</span>
        <span className={navLinkClass}>{t("nav.seller")}</span>
        <span className={navLinkClass}>{t("nav.customerService")}</span>
      </div>
    </nav>
  );
}

export function HeaderNav() {
  return (
    <Suspense fallback={<HeaderNavFallback />}>
      <HeaderNavInner />
    </Suspense>
  );
}
