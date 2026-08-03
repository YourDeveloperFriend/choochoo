import { readFileSync } from "fs";
// Imported first: the engine and the map registry form an import cycle, and
// whichever side loads first wins. See src/testing/setup.ts.
import "../maps/registry";
import {
  Playthrough,
  prepareForReplay,
  replayPlaythrough,
} from "../testing/harness/playthrough";
import { relative, writePlaythrough } from "./playthrough_files";

/**
 * Turns a single game exported from production into a committed regression test.
 *
 *   npm run playthrough:import -- <export.json> [--force]
 *
 * This is the by-hand path, for a recording that needed fetching or editing
 * separately. To collect recordings straight from production across many maps,
 * use playthrough:collect instead.
 *
 * Get an export with:
 *   GET /api/games/:gameId/export      (admin only)
 */

function main(): void {
  const [source, ...flags] = process.argv.slice(2);
  if (source == null) {
    throw new Error(
      "usage: npm run playthrough:import -- <export.json> [--force]",
    );
  }
  const force = flags.includes("--force");

  const raw = JSON.parse(readFileSync(source, "utf-8"));
  const playthrough: Playthrough = raw.game ?? raw;

  if (playthrough.startState == null) {
    throw new Error(
      `game ${playthrough.id} has no start state, so it cannot be replayed. ` +
        `That happens when a game was never played past setup.`,
    );
  }

  const prepared = prepareForReplay(playthrough, (message) =>
    // eslint-disable-next-line no-console
    console.log(message),
  );
  const result = replayPlaythrough(prepared);
  if (result.failure != null) {
    throw new Error(
      `game ${playthrough.id} does not replay against the current engine, so ` +
        `it cannot be imported:\n  ${result.failure}`,
    );
  }

  const paths = writePlaythrough(prepared, result.transcript, force);

  /* eslint-disable no-console */
  console.log(`imported game ${playthrough.id} (${playthrough.gameKey})`);
  console.log(
    `  replayed from: ${prepared.replayFrom}` +
      (prepared.playerColorRelabel != null
        ? ` (${prepared.playerColorRelabel})`
        : ""),
  );
  console.log(`  ${result.actionsApplied} actions replayed`);
  console.log(
    `  reached the end of the game: ${result.endedNaturally ? "yes" : "no"}`,
  );
  console.log(`  ${relative(paths.fixture)}`);
  console.log(`  ${relative(paths.transcript)}`);
  console.log(`  ${relative(paths.stub)}`);
  /* eslint-enable no-console */
}

main();
