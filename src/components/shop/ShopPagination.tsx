import Link from "next/link";

interface ShopPaginationProps {
  page: number;
  totalPages: number;
  searchParams: Record<string, string>;
  basePath?: string;
}

export function ShopPagination({
  page,
  totalPages,
  searchParams,
  basePath = "/shop",
}: ShopPaginationProps) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams(searchParams);
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
      aria-label="Pagination"
    >
      {page > 1 && (
        <Link
          href={hrefFor(page - 1)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Previous
        </Link>
      )}
      <span className="px-3 text-sm text-zinc-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
