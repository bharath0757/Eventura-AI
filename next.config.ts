import type { NextConfig } from "next";

// Route layouts own their styles; keep normal stylesheet caching and delivery.
const nextConfig: NextConfig = {
  images: {
    // Keep detailed photos available while reducing the hero's critical transfer.
    qualities: [50, 75],
  },
};

export default nextConfig;
