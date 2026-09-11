import type { NextConfig } from "next";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      { source: "/seller", destination: "/myshop", permanent: true },
      { source: "/seller/:path*", destination: "/myshop/:path*", permanent: true },
      { source: "/sell", destination: "/myshop", permanent: true },
      { source: "/sell/register", destination: "/myshop/register", permanent: true },
      { source: "/sell/:path*", destination: "/myshop/:path*", permanent: true },
    ];
  },
  async rewrites() {
    // Serve runtime uploads from disk. `next start` does not reliably pick up
    // files written to public/ after the process starts.
    return {
      beforeFiles: [
        {
          source: "/uploads/products/:filename",
          destination: "/api/uploads/products/:filename",
        },
        // Legacy seller API paths (UI is /myshop; DB role remains SELLER).
        {
          source: "/api/seller",
          destination: "/api/myshop",
        },
        {
          source: "/api/seller/:path*",
          destination: "/api/myshop/:path*",
        },
      ],
    };
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75],
    deviceSizes: [360, 420, 640, 750, 828, 1080],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    localPatterns: [
      {
        pathname: "/uploads/products/**",
      },
      {
        pathname: "/api/uploads/products/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.t3.storageapi.dev",
      },
      {
        protocol: "https",
        hostname: "t3.storageapi.dev",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "cdn.shegershop.com",
      },
      {
        protocol: "https",
        hostname: "shegershop.com",
      },
      {
        protocol: "https",
        hostname: "**.up.railway.app",
      },
    ],
  },
};

export default nextConfig;
