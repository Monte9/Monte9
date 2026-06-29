import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standard Next.js app on Vercel (NOT static export) so route handlers run as
  // serverless functions (e.g. /api/learn). Pages without dynamic data are still
  // statically optimized; the client-only WebGL apps + globe are unaffected.
  trailingSlash: true,
};

export default nextConfig;
