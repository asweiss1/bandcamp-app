import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server is opened at 127.0.0.1 while Next treats localhost as the
  // default host. Without this, the HMR socket answers "Unauthorized" and the
  // page never hydrates, so buttons look clickable but do nothing.
  allowedDevOrigins: ["127.0.0.1"],
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
