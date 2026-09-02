"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import {
  isManagedUploadPath,
  productImageServeUrl,
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
  fill,
  priority,
  ...props
}: ProductImageProps) {
  const trimmed = src?.trim();
  const [useGalleryFallback, setUseGalleryFallback] = useState(false);

  if (!trimmed) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 text-xs text-zinc-400 ${className ?? ""}`}
        aria-label={alt || "No image"}
      />
    );
  }

  const activeVariant =
    useGalleryFallback && (variant === "card" || variant === "thumb")
      ? "gallery"
      : variant;
  const resolved = productImageServeUrl(trimmed, activeVariant);

  // Plain img for local uploads — next/image can cache 404s when files appear after upload.
  if (isManagedUploadPath(trimmed)) {
    const imgClass = fill
      ? `absolute inset-0 h-full w-full object-cover ${className ?? ""}`
      : className;

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={alt}
        className={imgClass}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => {
          if (
            !useGalleryFallback &&
            (variant === "card" || variant === "thumb")
          ) {
            setUseGalleryFallback(true);
          }
        }}
        {...(fill ? {} : props)}
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      className={className}
      fill={fill}
      priority={priority}
      unoptimized={shouldUnoptimizeProductImage(trimmed)}
      quality={70}
      {...props}
    />
  );
}
