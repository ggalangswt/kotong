import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.KOTONG_E2E === "1" ? ".next-test" : ".next",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
