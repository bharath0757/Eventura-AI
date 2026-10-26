import type { NextConfig } from "next";

// Deliver the small route-scoped styles with the first response on slow networks.
// Next 16.4.3 keeps stylesheet links for client navigation. See the measured
// first-load/cache trade-off in docs/performance-quality.md before changing this.
const nextConfig: NextConfig = { experimental: { inlineCss: true } };

export default nextConfig;
