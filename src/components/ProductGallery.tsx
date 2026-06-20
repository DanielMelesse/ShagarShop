"use client";

import { ProductImage } from "@/components/ProductImage";
import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const gallery = images.length > 0 ? images : [];
  const activeImage = gallery[activeIndex] ?? gallery[0];

  if (!activeImage) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-zinc-100 text-sm text-zinc-400">
        No image
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100">
        <ProductImage
          src={activeImage}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((image, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`View image ${index + 1} of ${gallery.length}`}
                aria-current={active ? "true" : undefined}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  active
                    ? "border-brand-600 ring-2 ring-brand-600/20"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <ProductImage
                  src={image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
