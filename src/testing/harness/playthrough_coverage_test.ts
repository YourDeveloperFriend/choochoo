import { existsSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { describe, expect, it } from "vitest";

/**
 * Checks that every committed recording is actually being replayed.
 *
 * Recordings are driven by a generated test file each, so a recording whose stub
 * is missing is simply never run -- and the suite stays green while covering
 * nothing. This is the guard against that.
 */
describe("recorded playthroughs", () => {
  const mapsRoot = resolve(__dirname, "../../maps");

  const recordings = readdirSync(mapsRoot).flatMap((mapDirectory) => {
    const directory = join(mapsRoot, mapDirectory, "playthroughs");
    if (!existsSync(directory)) return [];
    return readdirSync(directory)
      .filter((file) => file.endsWith(".json"))
      .map((file) => ({
        mapDirectory,
        directory,
        name: file.replace(/\.json$/, ""),
      }));
  });

  it("has at least one recording committed", () => {
    expect(recordings.length).toBeGreaterThan(0);
  });

  for (const recording of recordings) {
    describe(`${recording.mapDirectory}/${recording.name}`, () => {
      it("has a test that replays it", () => {
        expect(
          existsSync(join(recording.directory, `${recording.name}_test.ts`)),
          `recording ${recording.name} has no ${recording.name}_test.ts, so it is never replayed`,
        ).toBe(true);
      });

      it("has a recorded transcript", () => {
        expect(
          existsSync(
            join(recording.directory, `${recording.name}.expected.txt`),
          ),
          `recording ${recording.name} has no transcript; re-run the importer`,
        ).toBe(true);
      });
    });
  }
});
