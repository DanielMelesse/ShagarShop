import type { Category } from "@/lib/types";

export interface Department {
  slug: string;
  label: string;
  /** Maps to seeded product categories when available. */
  productCategory?: Category;
  /** Special page instead of department listing. */
  href?: string;
}

export const departments: Department[] = [
  { slug: "arts-crafts", label: "Arts & Crafts", productCategory: "home" },
  { slug: "automotive", label: "Automotive" },
  { slug: "baby", label: "Baby" },
  { slug: "beauty-personal-care", label: "Beauty & Personal Care" },
  { slug: "books", label: "Books", productCategory: "books" },
  { slug: "boys-fashion", label: "Boys Fashion", productCategory: "fashion" },
  { slug: "computers", label: "Computers", productCategory: "electronics" },
  { slug: "deals", label: "Deals", href: "/shop?featured=1" },
  { slug: "digital-music", label: "Digital Music", productCategory: "electronics" },
  { slug: "electronics", label: "Electronics", productCategory: "electronics" },
  { slug: "girls-fashion", label: "Girls Fashion", productCategory: "fashion" },
  { slug: "health-household", label: "Health and Household", productCategory: "home" },
  { slug: "home-kitchen", label: "Home & Kitchen", productCategory: "home" },
  { slug: "kindle-store", label: "Kindle Store", productCategory: "books" },
  { slug: "luggage", label: "Luggage", productCategory: "fashion" },
  { slug: "mens-fashion", label: "Mens Fashion", productCategory: "fashion" },
  { slug: "movies-music", label: "Movies and Music", productCategory: "electronics" },
  { slug: "pets-supplies", label: "Pets Supplies" },
  { slug: "software", label: "Software", productCategory: "electronics" },
  { slug: "sports-outdoors", label: "Sports and Outdoors", productCategory: "sports" },
  { slug: "tools-home-improvement", label: "Tools and Home Improvement", productCategory: "home" },
  { slug: "toys-games", label: "Toys & Games" },
  { slug: "video-games", label: "Video Games", productCategory: "electronics" },
  { slug: "womens-fashion", label: "Women's Fashion", productCategory: "fashion" },
];

export type DepartmentSlug = string;

export const ALL_DEPARTMENTS_LABEL = "All Department";

export const ALL_DEPARTMENTS_HREF = "/shop/departments";

export function getDepartmentBySlug(slug: string): Department | undefined {
  return departments.find((d) => d.slug === slug);
}

export function isDepartmentSlug(slug: string): boolean {
  return departments.some((d) => d.slug === slug && !d.href);
}

export function getDepartmentHref(department: Department): string {
  if (department.href) return department.href;
  return `/shop/department/${department.slug}`;
}

export function getDepartmentSearchOptions() {
  return [
    { value: "all", label: ALL_DEPARTMENTS_LABEL },
    ...departments
      .filter((d) => d.slug !== "deals")
      .map((d) => ({ value: d.slug, label: d.label })),
  ];
}

export function getSellerDepartmentOptions() {
  return departments
    .filter((d) => d.slug !== "deals")
    .map((d) => ({ value: d.slug, label: d.label }));
}

export function isSellerDepartmentSlug(value: string): boolean {
  return departments.some((d) => d.slug === value && d.slug !== "deals");
}

export function getDepartmentProductCategory(slug: string): Category | undefined {
  return getDepartmentBySlug(slug)?.productCategory;
}

export function departmentNeedsSize(slug: string): boolean {
  const category = getDepartmentProductCategory(slug);
  return category === "fashion" || category === "sports";
}

/** Map legacy product category ids to a default department slug for editing. */
export function legacyCategoryToDepartmentSlug(category: string): string {
  if (isSellerDepartmentSlug(category)) return category;
  const match = departments.find((d) => d.productCategory === category);
  return match?.slug ?? "home-kitchen";
}

/** Where the search-bar department picker should navigate. */
export function getSearchDepartmentHref(value: string): string {
  if (value === "all") return ALL_DEPARTMENTS_HREF;
  const department = getDepartmentBySlug(value);
  return department ? getDepartmentHref(department) : ALL_DEPARTMENTS_HREF;
}
