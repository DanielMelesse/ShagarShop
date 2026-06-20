import Link from "next/link";
import {
  ALL_DEPARTMENTS_LABEL,
  departments,
  getDepartmentHref,
} from "@/lib/departments";

export function DepartmentGrid() {
  const browseDepartments = departments.filter((d) => d.slug !== "deals");

  return (
    <section className="mt-14 rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-8 sm:px-8">
      <h2 className="text-xl font-bold text-zinc-900">Shop by department</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Browse every category across {ALL_DEPARTMENTS_LABEL.toLowerCase()}.
      </p>

      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {browseDepartments.map((department) => (
          <Link
            key={department.slug}
            href={getDepartmentHref(department)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
          >
            {department.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
