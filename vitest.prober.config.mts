import { defineConfig } from "vitest/config";

// The prober runs against production on a schedule (see .github/workflows/probe.yml).
// It is deliberately kept out of the default `vitest run` config.
export default defineConfig({
  test: {
    include: ["src/prober/**/*_test.ts"],
    environment: "node",
    // Jasmine's DEFAULT_TIMEOUT_INTERVAL covered both specs and hooks with a
    // single knob. Vitest splits them, and the web driver is built in a
    // beforeAll, so both need raising.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
