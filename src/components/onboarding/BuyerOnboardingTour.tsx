"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "@/context/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import { isBuyerRole } from "@/lib/user-role";

const STEP_KEYS = [
  "welcome",
  "search",
  "addToCart",
  "checkout",
  "deliveryAddress",
  "payment",
  "confirmation",
] as const;

const STEP_IMAGES: Record<(typeof STEP_KEYS)[number], string> = {
  welcome: "/onboarding/welcome.png",
  search: "/onboarding/search.png",
  addToCart: "/onboarding/add-to-cart.png",
  checkout: "/onboarding/checkout.png",
  deliveryAddress: "/onboarding/delivery-address.png",
  payment: "/onboarding/payment.png",
  confirmation: "/onboarding/confirmation.png",
};

export function BuyerOnboardingTour() {
  const { t } = useTranslations();
  const { user, isReady } = useAuth();
  const { update } = useSession();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!user || !isBuyerRole(user.role)) {
      setOpen(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/account/onboarding", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled && !user.buyerOnboardingDone) {
            setOpen(true);
            setStep(0);
          }
          return;
        }
        const data = (await res.json()) as { buyerOnboardingDone?: boolean };
        if (cancelled) return;
        if (data.buyerOnboardingDone) {
          setOpen(false);
          if (!user.buyerOnboardingDone) void update().catch(() => undefined);
          return;
        }
        setOpen(true);
        setStep(0);
      } catch {
        if (!cancelled && !user.buyerOnboardingDone) {
          setOpen(true);
          setStep(0);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, user, user?.role, user?.buyerOnboardingDone, update]);

  const complete = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setOpen(false);
    try {
      await fetch("/api/account/onboarding", {
        method: "PATCH",
        credentials: "same-origin",
      });
      await update();
    } catch {
      /* modal already dismissed; next visit will retry if flag unset */
    } finally {
      setSaving(false);
    }
  }, [saving, update]);

  if (!open) return null;

  const total = STEP_KEYS.length;
  const key = STEP_KEYS[step];
  const isLast = step === total - 1;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-900/50 p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="buyer-onboarding-title"
    >
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-w-3xl sm:flex-row">
        <div className="relative h-40 w-full shrink-0 bg-zinc-100 sm:h-auto sm:w-[48%] sm:min-h-[280px]">
          <Image
            src={STEP_IMAGES[key]}
            alt=""
            fill
            priority
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, 420px"
          />
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4 p-5 sm:gap-5 sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              {t("onboarding.stepOf", { current: step + 1, total })}
            </p>
            <h2
              id="buyer-onboarding-title"
              className="mt-1.5 text-lg font-bold text-zinc-900 sm:text-2xl"
            >
              {t(`onboarding.steps.${key}.title`)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-base">
              {t(`onboarding.steps.${key}.body`)}
            </p>
          </div>

          <div>
            <div className="mb-4 flex gap-1" aria-hidden>
              {STEP_KEYS.map((_, i) => (
                <span
                  key={STEP_KEYS[i]}
                  className={`h-1.5 flex-1 rounded-full ${
                    i <= step ? "bg-brand-600" : "bg-zinc-200"
                  }`}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-center sm:gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (isLast) void complete();
                  else setStep((s) => s + 1);
                }}
                className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60 sm:flex-1"
              >
                {isLast ? t("onboarding.startShopping") : t("onboarding.next")}
              </button>
              {step > 0 ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setStep((s) => s - 1)}
                  className="w-full rounded-xl border border-zinc-300 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 sm:w-auto sm:px-6"
                >
                  {t("onboarding.back")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void complete()}
                  className="w-full rounded-xl border border-zinc-300 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 sm:w-auto sm:px-6"
                >
                  {t("onboarding.skip")}
                </button>
              )}
            </div>

            {step > 0 && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void complete()}
                className="mt-2 w-full py-1.5 text-center text-sm font-medium text-zinc-500 hover:text-zinc-700 disabled:opacity-60"
              >
                {t("onboarding.skip")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
