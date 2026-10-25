import type { NextConfig } from "next";

// Phase 2 uses request-rendered wizard params and browser-local event records.
// Tailwind runs through postcss.config.mjs; avoid a second Turbopack CSS loader.
const nextConfig: NextConfig = {};

export default nextConfig;
