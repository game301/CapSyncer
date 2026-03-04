import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  output: "standalone",

  // Optimize images
  images: {
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;
