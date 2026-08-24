import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    proxyClientMaxBodySize: "8mb",
  },
};

export default nextConfig;
