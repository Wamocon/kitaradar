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
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        lines: 80,
        functions: 80,
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
