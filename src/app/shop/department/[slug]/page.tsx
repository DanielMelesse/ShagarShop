import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import {
  ALL_DEPARTMENTS_HREF,
  ALL_DEPARTMENTS_LABEL,
  getDepartmentBySlug,
  isDepartmentSlug,
} from "@/lib/departments";
import { filterProductsByDepartment } from "@/lib/products-server";

export const dynamic = "force-dynamic";

interface DepartmentPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DepartmentPageProps) {
  const { slug } = await params;
  const department = getDepartmentBySlug(slug);
  if (!department) return { title: "Department — ShegerShop" };
  return {
    title: `${department.label} — ShegerShop`,
    description: `Shop ${department.label} on ShegerShop.`,
  };
}

export default async function DepartmentPage({ params }: DepartmentPageProps) {
  const { slug } = await params;

  if (!isDepartmentSlug(slug)) {
    notFound();
  }

  const department = getDepartmentBySlug(slug)!;

  if (department.href) {
    redirect(department.href);
  }
  const products = await filterProductsByDepartment(slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-zinc-500">
        <Link href={ALL_DEPARTMENTS_HREF} className="hover:text-brand-600">
          {ALL_DEPARTMENTS_LABEL}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">{department.label}</span>
      </nav>

      <h2 className="mt-4 text-2xl font-bold text-zinc-900">{department.label}</h2>
      <p className="mt-1 text-sm text-zinc-500">
        {products.length} product{products.length !== 1 ? "s" : ""}
      </p>

      {products.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
          <p className="text-lg font-medium text-zinc-800">No products yet</p>
          <p className="mt-2 text-sm text-zinc-500">
            Check back soon — sellers are adding items to {department.label}.
          </p>
          <Link
            href={ALL_DEPARTMENTS_HREF}
            className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Browse all departments
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
