import Image, { type ImageProps } from "next/image";
import { shouldUnoptimizeProductImage } from "@/lib/product-image";

type ProductImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
};

export function ProductImage({ src, alt, className, ...props }: ProductImageProps) {
  const trimmed = src?.trim();

  if (!trimmed) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 text-xs text-zinc-400 ${className ?? ""}`}
        aria-label={alt || "No image"}
      />
    );
  }

  return (
    <Image
      src={trimmed}
      alt={alt}
      className={className}
      unoptimized={shouldUnoptimizeProductImage(trimmed)}
      {...props}
    />
  );
}
