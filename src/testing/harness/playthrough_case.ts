import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { beforeAll, describe, expect, it } from "vitest";
import { Playthrough, replayPlaythrough } from "./playthrough";

/**
 * Registers the tests for one recorded game.
 *
 * Each recording gets its own generated test file calling this, rather than one
 * file discovering them all, so that vitest can spread them across workers. A
 * replay takes seconds, and running a corpus of them serially in a single file
 * would dominate the suite.
 */
export function describePlaythrough(directory: string, name: string): void {
  const fixture = join(directory, `${name}.json`);
  const transcriptPath = join(directory, `${name}.expected.txt`);

  describe(`recorded playthrough ${name}`, () => {
    const playthrough = JSON.parse(
      readFileSync(fixture, "utf-8"),
    ) as Playthrough;

    // Replayed once and shared: running it per assertion doubled the cost for no
    // extra coverage.
    let result: ReturnType<typeof replayPlaythrough>;
    // No timeout argument on purpose: one here would override hookTimeout from
    // vitest.playthroughs.config.mts, which is where the limit belongs -- how long
    // a replay may take depends on how many of them are sharing the machine, not
    // on this file.
    beforeAll(() => {
      result = replayPlaythrough(playthrough);
    });

    it("replays every recorded action", () => {
      // Checked before the transcript: an action that stopped applying is a
      // more specific finding than a diff, and it names the action and round.
      expect(result.failure).toBeUndefined();
      expect(result.actionsApplied).toBe(playthrough.actions.length);
    });

    it("plays out to the recorded numbers", () => {
      expect(
        existsSync(transcriptPath),
        `no transcript at ${transcriptPath}; re-run the importer`,
      ).toBe(true);

      expect(result.transcript).toBe(readFileSync(transcriptPath, "utf-8"));
    });
  });
}
