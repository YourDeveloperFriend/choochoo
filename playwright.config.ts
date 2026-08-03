import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end specs: a real browser against a real server and database.
 *
 * These cover wiring, and only wiring -- that a click reaches the engine, that a
 * page renders, that a form submits. What the engine then does with an action is
 * covered far more cheaply in process, so a spec here that re-asserts game state
 * is a spec in the wrong place.
 *
 * Requires postgres and redis. Locally that is the same pair the dev server uses;
 * see .github/workflows/e2e.yml for how CI provides them. The server is started
 * from source rather than from bin/, because the compiled output does not include
 * the client's HTML.
 *
 *   npm run e2e                 headless
 *   npm run e2e -- --headed     watch it happen
 *   npm run e2e -- --ui         Playwright's inspector
 */

const PORT = Number(process.env.PORT ?? 3001);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "src/e2e",
  // Deliberately not *_test.ts: vitest claims that suffix, and a file picked up
  // by the wrong runner fails in confusing ways.
  testMatch: "**/*_spec.ts",

  // Retries stand in for the old deflake.sh, which re-ran the whole suite up to
  // three times and passed if any run passed. Retrying the failing test is
  // strictly better: it is faster, and it reports which test was flaky instead
  // of hiding it.
  retries: process.env.CI ? 2 : 0,
  // The specs share one database, so they are not safe to run against each other.
  workers: 1,
  forbidOnly: !!process.env.CI,

  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  use: {
    baseURL: BASE_URL,
    // Kept on retries only: capturing every run makes the artifacts useless.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: "npm run e2e-server",
    url: BASE_URL,
    // The server builds the client with esbuild on the way up, which is slow the
    // first time and on a cold CI cache.
    timeout: 180_000,
    // Locally, reuse a server that is already up so the specs start immediately.
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
});
