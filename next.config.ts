import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // maplibre-gl uses browser-only APIs (WebGL, canvas) at module level.
  // Telling Next.js not to bundle it server-side prevents Turbopack dev
  // from failing with JSON parse errors when analysing the module graph.
  serverExternalPackages: ["maplibre-gl"],
};

export default withNextIntl(nextConfig);
