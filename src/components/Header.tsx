"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HeaderSearch } from "@/components/HeaderSearch";
import { useTranslations } from "@/context/LocaleContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useIsSeller } from "@/hooks/useIsSeller";
import { useMounted } from "@/hooks/useMounted";
import { headerSellButtonClass } from "@/lib/header-ui";
import { isAdminAppPath, ADMIN_HOME } from "@/lib/admin-routes";
import { isDeliveryAppPath, DELIVER_LANDING, DELIVERY_HOME } from "@/lib/delivery-routes";
import { isSellerAppPath, SELLER_HOME } from "@/lib/seller-routes";
import { ACCOUNT_HOME } from "@/lib/account-routes";
import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";
import { isAdminRole, isDeliveryRole } from "@/lib/user-role";

const navLinkClass =
  "text-sm font-medium text-zinc-600 transition hover:text-brand-600";

function HeaderActions({
  showUser,
  showCartBadge,
  itemCount,
  onLogout,
}: {
  showUser: boolean;
  showCartBadge: boolean;
  itemCount: number;
  onLogout: () => void;
}) {
  const { t } = useTranslations();

  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-2">
      <LanguageSwitcher />

      {showUser ? (
        <>
          <Link
            href={ACCOUNT_HOME}
            className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-brand-600 sm:px-3"
          >
            {t("nav.account")}
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 sm:px-3"
          >
            {t("nav.logout")}
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-brand-600 sm:px-3"
        >
          {t("nav.login")}
        </Link>
      )}

      <Link
        href="/cart"
        aria-label={
          showCartBadge
            ? t("nav.cartAria", { count: itemCount })
            : t("nav.cartAriaEmpty")
        }
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700"
      >
        <CartIcon />
        {showCartBadge && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-xs font-bold text-white">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </Link>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const mounted = useMounted();
  const { t } = useTranslations();
  const { user, isReady: authReady, logout } = useAuth();
  const { isSeller, checkingSeller } = useIsSeller();
  const { itemCount, isReady: cartReady } = useCart();

  const showUser = mounted && authReady && user;
  const sellerAccount = showUser && (isSeller || checkingSeller);
  const onSellerSurface =
    pathname.startsWith("/sell") || isSellerAppPath(pathname);
  const onDeliverySurface =
    pathname.startsWith("/deliver") || isDeliveryAppPath(pathname);
  const onAdminSurface = isAdminAppPath(pathname);
  const deliveryAccount = showUser && isDeliveryRole(user?.role);
  const adminAccount = showUser && isAdminRole(user?.role);
  const sellerNav =
    onSellerSurface &&
    (sellerAccount || (mounted && authReady && !showUser));
  const deliveryNav =
    onDeliverySurface &&
    (deliveryAccount || (mounted && authReady && !showUser));
  const adminNav = onAdminSurface && (adminAccount || (mounted && authReady && !showUser));
  const showCartBadge =
    mounted &&
    cartReady &&
    itemCount > 0 &&
    !sellerNav &&
    !deliveryNav &&
    !adminNav;

  if (adminNav) {
    return (
      <header className="border-b border-zinc-200/80 bg-white/90">
        <div className="mx-auto flex max-w-7xl flex-nowrap items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
          <Link
            href={ADMIN_HOME}
            aria-label="ShegerShop admin"
            className="flex shrink-0 items-center gap-2 font-bold tracking-tight transition hover:opacity-80"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm text-white">
              A
            </span>
            <span className="hidden text-lg text-zinc-900 sm:inline">
              Sheger<span className="text-brand-600">Shop</span>{" "}
              <span className="text-sm font-medium text-zinc-500">Admin</span>
            </span>
          </Link>

          <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            {adminAccount ? (
              <button
                type="button"
                onClick={() => logout()}
                className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 sm:px-3"
              >
                {t("nav.logout")}
              </button>
            ) : (
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(ADMIN_HOME)}`}
                className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-brand-600 sm:px-3"
              >
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      </header>
    );
  }

  if (deliveryNav) {
    return (
      <header className="border-b border-zinc-200/80 bg-white/90">
        <div className="mx-auto flex max-w-7xl flex-nowrap items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
          <Link
            href={DELIVER_LANDING}
            aria-label="ShegerShop delivery"
            className="flex shrink-0 items-center gap-2 font-bold tracking-tight transition hover:opacity-80"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
              S
            </span>
            <span className="hidden text-lg text-zinc-900 sm:inline">
              Sheger<span className="text-brand-600">Shop</span>
            </span>
          </Link>

          <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link href={DELIVERY_HOME} className={headerSellButtonClass}>
              Delivery
            </Link>
            {deliveryAccount ? (
              <button
                type="button"
                onClick={() => logout()}
                className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 sm:px-3"
              >
                {t("nav.logout")}
              </button>
            ) : (
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(DELIVER_LANDING)}`}
                className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-brand-600 sm:px-3"
              >
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      </header>
    );
  }

  if (sellerNav) {
    return (
      <header className="border-b border-zinc-200/80 bg-white/90">
        <div className="mx-auto flex max-w-7xl flex-nowrap items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
          <Link
            href={TODAYS_DEALS_HREF}
            aria-label="ShegerShop home"
            className="flex shrink-0 items-center gap-2 font-bold tracking-tight transition hover:opacity-80"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
              S
            </span>
            <span className="hidden text-lg text-zinc-900 sm:inline">
              Sheger<span className="text-brand-600">Shop</span>
            </span>
          </Link>

          <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link href={SELLER_HOME} className={headerSellButtonClass}>
              {t("nav.sell")}
            </Link>
            {(pathname.startsWith("/sell") || isSellerAppPath(pathname)) && (
              <Link href="/shop/departments" className={`${navLinkClass} whitespace-nowrap`}>
                {t("nav.backToShop")}
              </Link>
            )}
            {sellerAccount && !checkingSeller ? (
              <>
                <Link
                  href={ACCOUNT_HOME}
                  className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-brand-600 sm:px-3"
                >
                  {t("nav.account")}
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 sm:px-3"
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : !checkingSeller ? (
              <Link
                href="/login?callbackUrl=/seller"
                className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-brand-600 sm:px-3"
              >
                {t("nav.login")}
              </Link>
            ) : null}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-zinc-200/80 bg-white/90">
      <div className="mx-auto flex max-w-7xl flex-nowrap items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <Link
          href={TODAYS_DEALS_HREF}
          aria-label="ShegerShop home"
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight transition hover:opacity-80"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
            S
          </span>
          <span className="hidden text-base text-zinc-900 sm:inline sm:text-lg">
            Sheger<span className="text-brand-600">Shop</span>
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 sm:gap-3">
          <HeaderSearch />
        </div>

        <HeaderActions
          showUser={!!showUser}
          showCartBadge={showCartBadge}
          itemCount={itemCount}
          onLogout={() => logout()}
        />
      </div>
    </header>
  );
}

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
