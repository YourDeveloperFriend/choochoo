import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*_test.ts", "src/**/*_test.tsx"],
    // The prober drives a real browser against production on a schedule; it has
    // its own config (vitest.prober.config.mts) and must not run here.
    exclude: ["src/prober/**", "node_modules/**"],
    environment: "node",
    // Breaks an engine/map-registry import cycle; see the file for detail.
    setupFiles: ["src/testing/setup.ts"],
  },
});
