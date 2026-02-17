import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Cloudflare Pages doesn't support Next.js image optimization
  },
};

export default nextConfig;
