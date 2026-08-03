import { defineConfig, devices } from "@playwright/test";

/**
 * The production probe. Runs on a schedule; see .github/workflows/probe.yml.
 *
 * Separate from the end-to-end config because it drives the live site instead of
 * starting a server: no webServer, no database, and read-only.
 *
 * Retries replace deflake.sh, which re-ran the whole thing up to three times and
 * passed if any run passed. Retrying is better here for the same reason it is
 * better anywhere: it is quicker, and a flake stays visible in the report instead
 * of being swallowed.
 */
export default defineConfig({
  testDir: "src/prober",
  testMatch: "**/*_spec.ts",

  retries: 2,
  workers: 1,
  timeout: 120_000,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  use: {
    baseURL: process.env.PROBER_BASE_URL ?? "https://www.choochoo.games",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
});
