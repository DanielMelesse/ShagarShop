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
    <footer className="mt-auto shrink-0 border-t border-zinc-200 bg-white">
      <div className="mx-auto w-full max-w-7xl overflow-x-auto px-4 py-8 sm:px-6 sm:py-12">
        <div className="min-w-[520px]">
          <div className="text-center">
            <Link href={TODAYS_DEALS_HREF} className="font-bold text-zinc-900 transition hover:text-brand-600">
              Sheger<span className="text-brand-600">Shop</span>
            </Link>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">{t("brand.tagline")}</p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-6 sm:gap-8">
            <div className="min-w-0">
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
            <div className="min-w-0">
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
            <div className="min-w-0">
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
        </div>
        <p className="mt-8 text-center text-xs text-zinc-400 sm:mt-10" suppressHydrationWarning>
          © {year} ShegerShop
        </p>
      </div>
    </footer>
  );
}
