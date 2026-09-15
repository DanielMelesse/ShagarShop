"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "@/context/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import { isBuyerRole } from "@/lib/user-role";

const STEP_KEYS = ["welcome", "search", "cart", "account"] as const;

const STEP_IMAGES: Record<(typeof STEP_KEYS)[number], string> = {
  welcome: "/onboarding/welcome.png",
  search: "/onboarding/search.png",
  cart: "/onboarding/cart.png",
  account: "/onboarding/account.png",
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
    if (user.buyerOnboardingDone) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setStep(0);
  }, [isReady, user, user?.role, user?.buyerOnboardingDone]);

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
      className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="buyer-onboarding-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-w-2xl md:max-w-3xl">
        <div className="relative aspect-[16/10] w-full shrink-0 bg-zinc-100 sm:aspect-[16/9]">
          <Image
            src={STEP_IMAGES[key]}
            alt=""
            fill
            priority
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, 768px"
          />
        </div>

        <div className="overflow-y-auto p-6 sm:p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 sm:text-sm">
            {t("onboarding.stepOf", { current: step + 1, total })}
          </p>
          <h2
            id="buyer-onboarding-title"
            className="mt-2 text-xl font-bold text-zinc-900 sm:mt-3 sm:text-3xl"
          >
            {t(`onboarding.steps.${key}.title`)}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:mt-4 sm:text-lg sm:leading-relaxed">
            {t(`onboarding.steps.${key}.body`)}
          </p>

          <div className="mt-6 flex gap-1.5 sm:mt-8 sm:gap-2" aria-hidden>
            {STEP_KEYS.map((_, i) => (
              <span
                key={STEP_KEYS[i]}
                className={`h-1.5 flex-1 rounded-full sm:h-2 ${
                  i <= step ? "bg-brand-600" : "bg-zinc-200"
                }`}
              />
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row-reverse sm:items-center sm:gap-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (isLast) void complete();
                else setStep((s) => s + 1);
              }}
              className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60 sm:flex-1 sm:py-4 sm:text-base"
            >
              {isLast ? t("onboarding.startShopping") : t("onboarding.next")}
            </button>
            {step > 0 ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => setStep((s) => s - 1)}
                className="w-full rounded-xl border border-zinc-300 py-3.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
              >
                {t("onboarding.back")}
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => void complete()}
                className="w-full rounded-xl border border-zinc-300 py-3.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
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
              className="mt-3 w-full py-2 text-center text-sm font-medium text-zinc-500 hover:text-zinc-700 disabled:opacity-60 sm:mt-4 sm:text-base"
            >
              {t("onboarding.skip")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
