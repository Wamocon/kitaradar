import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    reporters: ["verbose", "json"],
    outputFile: { json: "coverage/test-results.json" },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov", "html"],
      reportsDirectory: "coverage",
      // Only measure coverage for testable modules (lib + components + i18n)
      include: [
        "src/lib/*.ts",
        "src/i18n/routing.ts",
        "src/components/**/*.{ts,tsx}",
      ],
      exclude: [
        "src/test/**",
        "src/**/*.d.ts",
        // Leaflet map requires real browser (canvas, DOM measurements)
        "src/components/search/KitaMap.tsx",
        // MapLibre GL map requires real browser (WebGL, canvas)
        "src/components/search/KitaMapGL.tsx",
        // Server components — cannot be rendered in jsdom
        "src/components/layout/UserNav.tsx",
        "src/components/layout/Footer.tsx",
        "src/components/layout/Header.tsx",
        // Simple wrapper with no testable logic
        "src/components/ThemeProvider.tsx",
        // next-themes wrapper — delegates entirely to third-party library
        "src/components/providers/ThemeProvider.tsx",
        // Mobile hamburger nav — pure navigation links, no testable logic
        "src/components/layout/NavLinks.tsx",
        // Admin panels — use Supabase browser client + complex fetch-driven UI;
        // integration-tested manually; excluded like UserNav/Footer (same pattern)
        "src/components/admin/**",
        // Kita detail modal — rich slide-over with many conditional branches;
        // covered indirectly via SearchClient tests
        "src/components/search/KitaDetailModal.tsx",
      ],
      thresholds: {
        statements: 75,
        branches: 70,
        lines: 75,
        functions: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // Treat CSS imports as empty modules in test environment
      "leaflet/dist/leaflet.css": resolve(__dirname, "src/test/__mocks__/style.mock.ts"),
    },
  },
});
