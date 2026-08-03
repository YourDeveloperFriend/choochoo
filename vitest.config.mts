import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*_test.ts", "src/**/*_test.tsx"],
    exclude: [
      // The prober drives a real browser against production on a schedule; it
      // has its own config (vitest.prober.config.mts) and must not run here.
      "src/prober/**",
      // Replaying a full recorded game per map takes minutes, which is too slow
      // to sit in the default run. Own config, own CI job; see
      // vitest.playthroughs.config.mts.
      "src/maps/*/playthroughs/**",
      "node_modules/**",
    ],
    environment: "node",
    // Breaks an engine/map-registry import cycle; see the file for detail.
    setupFiles: ["src/testing/setup.ts"],
  },
});
