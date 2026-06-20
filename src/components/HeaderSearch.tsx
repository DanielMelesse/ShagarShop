"use client";

import { ProductImage } from "@/components/ProductImage";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ALL_DEPARTMENTS_HREF,
  getSearchDepartmentHref,
} from "@/lib/departments";
import {
  buildShopSearchUrl,
  formatPrice,
  searchCategories,
  searchDepartments,
  type SearchDepartment,
} from "@/lib/products";
import { headerSearchButtonClass } from "@/lib/header-ui";
import type { Product } from "@/lib/types";

type DropdownItem =
  | { type: "product"; product: Product }
  | { type: "category"; id: string; label: string }
  | { type: "see-all"; query: string };

function SearchDepartmentSelect({
  department,
  onSelect,
}: {
  department: SearchDepartment;
  onSelect: (value: SearchDepartment) => void;
}) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected =
    searchDepartments.find((d) => d.value === department) ?? searchDepartments[0];
  const fullLabel = selected.label;
  const shortLabel =
    department === "all"
      ? "All"
      : fullLabel.includes("&")
        ? fullLabel.split("&")[0].trim()
        : fullLabel.split(" ")[0];

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0 border-r border-zinc-200">
      <button
        id="search-department"
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 min-w-[3.25rem] max-w-[4.5rem] items-center gap-0.5 bg-zinc-50 px-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/30 sm:min-w-[5.5rem] sm:max-w-[7.5rem] sm:gap-1 sm:px-2 md:max-w-[9.5rem] lg:max-w-[11rem]"
      >
        <span className="min-w-0 flex-1 truncate sm:hidden">{shortLabel}</span>
        <span className="hidden min-w-0 flex-1 truncate sm:inline">{fullLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition sm:h-4 sm:w-4 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          id={menuId}
          role="listbox"
          aria-labelledby="search-department"
          className="absolute left-0 top-full z-[60] mt-1 max-h-[min(70vh,20rem)] w-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-xl sm:w-64"
        >
          {searchDepartments.map((option) => {
            const isSelected = option.value === department;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(option.value as SearchDepartment);
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? "bg-brand-50 font-medium text-brand-800"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<SearchDepartment>("all");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  useEffect(() => {
    const match = pathname.match(/^\/shop\/department\/([^/]+)/);
    if (match) {
      setDepartment(match[1] as SearchDepartment);
      return;
    }
    if (pathname === ALL_DEPARTMENTS_HREF) {
      setDepartment("all");
    }
  }, [pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const params = new URLSearchParams({ q, department });
    fetch(`/api/products/search?${params}`)
      .then((res) => res.json())
      .then((data) => setSearchResults(data.products ?? []))
      .catch(() => setSearchResults([]));
  }, [debouncedQuery, department]);

  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;

  const items = useMemo((): DropdownItem[] => {
    if (!debouncedQuery.trim()) return [];
    const matchedCategories = searchCategories(debouncedQuery, department);
    return [
      ...matchedCategories.map(
        (c) => ({ type: "category", id: c.id, label: c.label }) as const,
      ),
      ...searchResults.map((p) => ({ type: "product", product: p }) as const),
      { type: "see-all", query: debouncedQuery.trim() },
    ];
  }, [debouncedQuery, department, searchResults]);

  const products = items.filter((i): i is { type: "product"; product: Product } => i.type === "product");
  const matchedCategories = items.filter(
    (i): i is { type: "category"; id: string; label: string } => i.type === "category",
  );
  const onlySeeAll = items.length === 1 && items[0].type === "see-all";

  const showDropdown = open && hasQuery;

  const goToShop = useCallback(
    (q?: string) => {
      const term = (q ?? query).trim();
      setOpen(false);
      setActiveIndex(-1);
      router.push(buildShopSearchUrl({ q: term, department }));
    },
    [query, department, router],
  );

  const selectItem = useCallback(
    (item: DropdownItem) => {
      if (item.type === "product") {
        setOpen(false);
        setQuery("");
        router.push(`/product/${item.product.id}`);
      } else if (item.type === "category") {
        setOpen(false);
        setQuery("");
        router.push(`/shop/department/${item.id}`);
      } else {
        goToShop(item.query);
      }
    },
    [goToShop, router],
  );

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (activeIndex >= 0 && items[activeIndex]) {
      selectItem(items[activeIndex]);
      return;
    }
    goToShop();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || items.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < items.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : items.length - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectItem(items[activeIndex]);
    }
  }

  function itemClass(active: boolean) {
    return active
      ? "bg-brand-50 text-brand-800"
      : "text-zinc-700 hover:bg-zinc-50";
  }

  function handleDepartmentSelect(value: SearchDepartment) {
    setDepartment(value);
    setOpen(false);
    router.push(getSearchDepartmentHref(value));
  }

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1 basis-0">
      <form
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-nowrap overflow-visible rounded-lg border border-zinc-300 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20"
        role="search"
      >
        <label htmlFor="search-department" className="sr-only">
          Search in department
        </label>
        <SearchDepartmentSelect
          department={department}
          onSelect={handleDepartmentSelect}
        />
        <label htmlFor="header-search" className="sr-only">
          Search products
        </label>
        <input
          id="header-search"
          type="search"
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => hasQuery && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? listboxId : undefined}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 sm:px-3"
        />
        <button type="submit" className={headerSearchButtonClass} aria-label="Search">
          <SearchIcon className="sm:hidden" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full z-50 mt-1 max-h-[min(70vh,24rem)] w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-xl"
        >
          {onlySeeAll && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              No matches for &ldquo;{trimmed}&rdquo;
            </p>
          )}

          {matchedCategories.length > 0 && (
            <div className="border-b border-zinc-100 px-2 py-2">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Categories
              </p>
              {items.map((item, idx) => {
                if (item.type !== "category") return null;
                const active = activeIndex === idx;
                return (
                  <button
                    key={`cat-${item.id}`}
                    id={`${listboxId}-option-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => selectItem(item)}
                    className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${itemClass(active)}`}
                  >
                    in {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {products.length > 0 && (
            <div className="px-2 py-2">
              {matchedCategories.length > 0 && (
                <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Products
                </p>
              )}
              {items.map((item, idx) => {
                if (item.type !== "product") return null;
                const active = activeIndex === idx;
                return (
                  <button
                    key={item.product.id}
                    id={`${listboxId}-option-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => selectItem(item)}
                    className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left ${
                      active ? "bg-brand-50" : "hover:bg-zinc-50"
                    }`}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                      <ProductImage
                        src={item.product.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatPrice(item.product.price)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {items.some((i) => i.type === "see-all") && (
            <>
              {!onlySeeAll && <div className="border-t border-zinc-100" />}
              {items.map((item, idx) => {
                if (item.type !== "see-all") return null;
                const active = activeIndex === idx;
                return (
                  <Link
                    key="see-all"
                    id={`${listboxId}-option-${idx}`}
                    href={buildShopSearchUrl({
                      q: item.query,
                      department,
                    })}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`block px-4 py-3 text-sm font-medium ${
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-brand-600 hover:bg-zinc-50"
                    }`}
                  >
                    See all results for &ldquo;{item.query}&rdquo;
                  </Link>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
