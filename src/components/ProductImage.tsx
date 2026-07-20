import Image, { type ImageProps } from "next/image";
import {
  resolveProductImageSrc,
  shouldUnoptimizeProductImage,
  type ProductImageVariant,
} from "@/lib/product-image";

type ProductImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
  /** Prefer smaller bytes on slow networks. */
  variant?: ProductImageVariant;
};

export function ProductImage({
  src,
  alt,
  className,
  variant = "gallery",
  ...props
}: ProductImageProps) {
  const trimmed = src?.trim();

  if (!trimmed) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 text-xs text-zinc-400 ${className ?? ""}`}
        aria-label={alt || "No image"}
      />
    );
  }

  const resolved = resolveProductImageSrc(trimmed, variant);

  return (
    <Image
      src={resolved}
      alt={alt}
      className={className}
      unoptimized={shouldUnoptimizeProductImage(trimmed)}
      quality={70}
      {...props}
    />
  );
}
