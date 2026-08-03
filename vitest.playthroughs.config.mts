import { defineConfig } from "vitest/config";

// Replays the recorded playthroughs: one real game per map, re-run action by
// action against the current engine (see src/testing/harness/playthrough.ts).
//
// Kept out of the default `vitest run` purely for speed. There is one recording
// per map and each is a full game, so together they take minutes while the rest
// of the suite takes seconds -- long enough to stop people running tests while
// they work. CI runs them as their own job, so nothing is traded away.
export default defineConfig({
  test: {
    include: ["src/maps/*/playthroughs/*_test.ts"],
    environment: "node",
    // Breaks an engine/map-registry import cycle; see the file for detail.
    setupFiles: ["src/testing/setup.ts"],
    // A recording is replayed once in a beforeAll and shared by its assertions,
    // so the time goes on the hook rather than the tests.
    hookTimeout: 300_000,
  },
});
