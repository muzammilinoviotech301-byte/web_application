import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Page bodies are read from disk at runtime (src/data/pages.ts), so make
  // sure server output includes them.
  outputFileTracingIncludes: {
    "/*": ["./content/pages/**/*.html"],
  },
  // This is the MENA site: /products shows the captured sap.com/mena products
  // page (sub-nav, portfolio categories) rather than the global US capture.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/products", destination: "/mena/products" }],
      afterFiles: [],
      fallback: [],
    };
  },
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
