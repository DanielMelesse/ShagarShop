import Image, { type ImageProps } from "next/image";
import { shouldUnoptimizeProductImage } from "@/lib/product-image";

type ProductImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
};

export function ProductImage({ src, alt, ...props }: ProductImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      unoptimized={shouldUnoptimizeProductImage(src)}
      {...props}
    />
  );
}
