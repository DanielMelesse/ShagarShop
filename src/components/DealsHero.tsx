import Link from "next/link";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/products";

/** Change this to try another deals hero look: brand | midnight | violet | sunset */
const DEALS_HERO_VARIANT = "sunset" as const;

type HeroVariant = "brand" | "midnight" | "violet" | "sunset";

interface DealsHeroProps {
  dealCount: number;
  activeCategoryLabel?: string;
}

function HeroShell({
  variant,
  dealCount,
  activeCategoryLabel,
}: DealsHeroProps & { variant: HeroVariant }) {
  const title = activeCategoryLabel
    ? `${activeCategoryLabel} deals`
    : "Today's Deals";

  const badges = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
        Limited time
      </span>
      <span className="rounded-full px-3 py-1 text-xs font-medium hero-deal-count-badge">
        {dealCount} deal{dealCount !== 1 ? "s" : ""} live
      </span>
    </div>
  );

  const body = (
    <>
      {badges}
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-xl text-base text-white/90 sm:text-lg">
        Hand-picked offers with top ratings — save big on bestsellers before
        they&apos;re gone.
      </p>
      <ul className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
        <li className="rounded-lg bg-white/15 px-3 py-2 backdrop-blur-sm">
          Up to 35% off
        </li>
        <li className="rounded-lg bg-white/15 px-3 py-2 backdrop-blur-sm">
          Free shipping {formatPrice(FREE_SHIPPING_THRESHOLD)}+
        </li>
        <li className="rounded-lg bg-white/15 px-3 py-2 backdrop-blur-sm">
          Top-rated picks
        </li>
      </ul>
    </>
  );

  const actions = (primaryBtn: string, secondaryBtn: string) => (
    <div className="mt-6 flex flex-wrap gap-3">
      <Link
        href="/shop"
        className={`rounded-xl bg-white px-5 py-2.5 text-sm font-semibold shadow-md transition ${primaryBtn}`}
      >
        Browse all products
      </Link>
      <Link
        href="/signup"
        className={`rounded-xl border px-5 py-2.5 text-sm font-semibold text-white transition ${secondaryBtn}`}
      >
        Join for faster checkout
      </Link>
    </div>
  );

  if (variant === "brand") {
    return (
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 text-white shadow-lg">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/4 h-32 w-32 rounded-full bg-brand-400/25 blur-2xl"
          aria-hidden
        />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10 [&_.hero-deal-count-badge]:bg-brand-950/40">
          {body}
          {actions("text-brand-800 hover:bg-brand-50", "border-white/40 hover:bg-white/10")}
        </div>
      </section>
    );
  }

  if (variant === "midnight") {
    return (
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-brand-900 text-white shadow-lg">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/4 h-32 w-32 rounded-full bg-brand-500/15 blur-2xl"
          aria-hidden
        />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10 [&_.hero-deal-count-badge]:bg-black/35">
          {body}
          {actions("text-zinc-900 hover:bg-zinc-100", "border-zinc-500 hover:bg-white/10")}
        </div>
      </section>
    );
  }

  if (variant === "violet") {
    return (
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900 via-purple-700 to-brand-700 text-white shadow-lg">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/4 h-32 w-32 rounded-full bg-fuchsia-400/20 blur-2xl"
          aria-hidden
        />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10 [&_.hero-deal-count-badge]:bg-violet-950/50">
          {body}
          {actions(
            "text-violet-900 hover:bg-violet-50",
            "border-white/35 hover:bg-white/10",
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-brand-600 text-white shadow-lg">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 left-1/4 h-32 w-32 rounded-full bg-brand-900/20 blur-2xl"
        aria-hidden
      />
      <div className="relative px-6 py-8 sm:px-10 sm:py-10 [&_.hero-deal-count-badge]:bg-zinc-900/30">
        {body}
        {actions("text-brand-700 hover:bg-brand-50", "border-white/40 hover:bg-white/10")}
      </div>
    </section>
  );
}

export function DealsHero(props: DealsHeroProps) {
  return <HeroShell variant={DEALS_HERO_VARIANT} {...props} />;
}
