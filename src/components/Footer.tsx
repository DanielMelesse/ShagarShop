"use client";

import Link from "next/link";
import { useTranslations } from "@/context/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import { ACCOUNT_HOME } from "@/lib/account-routes";
import { DELIVERY_HOME } from "@/lib/delivery-routes";
import { SELLER_HOME } from "@/lib/seller-routes";
import { ALL_PRODUCTS_HREF, TODAYS_DEALS_HREF } from "@/lib/shop-routes";
import { isDeliveryRole, isSellerRole } from "@/lib/user-role";

export function Footer() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const loggedIn = Boolean(user);

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href={TODAYS_DEALS_HREF} className="font-bold text-zinc-900 transition hover:text-brand-600">
              Sheger<span className="text-brand-600">Shop</span>
            </Link>
            <p className="mt-2 text-sm text-zinc-500">{t("brand.tagline")}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{t("footer.shop")}</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li>
                <Link href={ALL_PRODUCTS_HREF} className="hover:text-brand-600">
                  {t("footer.allProducts")}
                </Link>
              </li>
              <li>
                <Link href={TODAYS_DEALS_HREF} className="hover:text-brand-600">
                  {t("nav.todaysDeals")}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-brand-600">
                  {t("nav.cart")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{t("footer.account")}</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              {loggedIn ? (
                <>
                  <li>
                    <Link href={ACCOUNT_HOME} className="hover:text-brand-600">
                      {t("nav.account")}
                    </Link>
                  </li>
                  {isDeliveryRole(user?.role) && (
                    <li>
                      <Link href={DELIVERY_HOME} className="hover:text-brand-600">
                        Delivery
                      </Link>
                    </li>
                  )}
                  {isSellerRole(user?.role) && (
                    <li>
                      <Link href={SELLER_HOME} className="hover:text-brand-600">
                        {t("nav.seller")}
                      </Link>
                    </li>
                  )}
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="hover:text-brand-600">
                      {t("footer.logIn")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup" className="hover:text-brand-600">
                      {t("footer.signUp")}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{t("footer.help")}</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/service" className="hover:text-brand-600">
                  {t("footer.service")}
                </Link>
              </li>
              <li>
                <Link href="/customer-service" className="hover:text-brand-600">
                  {t("nav.customerService")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-zinc-400" suppressHydrationWarning>
          © {year} ShegerShop. {t("brand.demoNote")}
        </p>
      </div>
    </footer>
  );
}
