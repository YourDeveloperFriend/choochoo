import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*_test.ts", "src/**/*_test.tsx"],
    exclude: [
      // The prober drives a real browser against production on a schedule. It
      // runs under Playwright now (playwright.prober.config.ts), so nothing here
      // would match it anyway, but it stays excluded so that a vitest-based probe
      // could not reappear in the default run by accident.
      "src/prober/**",
      // Replaying a full recorded game per map takes minutes, which is too slow
      // to sit in the default run. Own config, own CI job; see
      // vitest.playthroughs.config.mts.
      "src/maps/*/playthroughs/**",
      "node_modules/**",
    ],
    environment: "node",
    // Well above vitest's 5s default. The heaviest tests here start real games
    // through the engine, which takes the better part of a second each -- fine
    // alone, but under 10x of headroom, and a loaded machine ate it. Raising this
    // costs nothing when tests pass and removes a class of false failure.
    testTimeout: 30_000,
    // Breaks an engine/map-registry import cycle; see the file for detail.
    setupFiles: ["src/testing/setup.ts"],
  },
});
