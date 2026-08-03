import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
// Imported first: the engine and the map registry form an import cycle, and
// whichever side loads first wins. See src/testing/setup.ts.
import "../maps/registry";
import { MapRegistry } from "../maps/registry";
import { Playthrough, replayPlaythrough } from "../testing/harness/playthrough";

/**
 * Turns a game exported from production into a committed regression test.
 *
 *   npm run playthrough:import -- <export.json> [--force]
 *
 * Writes the recording and its transcript next to the map it belongs to, where
 * playthrough_test.ts finds them. Re-running on an existing recording refuses to
 * overwrite the transcript unless --force is given: a changed transcript means
 * the game now plays out differently, which is the thing the test exists to
 * catch, so it should be reviewed rather than silently accepted.
 *
 * Get an export with:
 *   GET /api/games/:gameId/export      (admin only)
 */

/**
 * The source directory a map lives in.
 *
 * Directory names do not consistently match game keys -- "rust-belt" lives in
 * rust_belt, "chesapeake-and-ohio" in chesapeake-and-ohio -- so both spellings
 * are tried.
 */
function directoryFor(gameKey: string): string {
  const known = [...MapRegistry.singleton.values()].some(
    (settings) => settings.key === gameKey,
  );
  if (!known) throw new Error(`no registered map with key "${gameKey}"`);

  const root = resolve(__dirname, "../maps");
  for (const candidate of [
    gameKey,
    gameKey.replace(/-/g, "_"),
    gameKey.replace(/_/g, "-"),
  ]) {
    const path = join(root, candidate);
    if (existsSync(path)) return path;
  }
  throw new Error(
    `map "${gameKey}" is registered but no directory under src/maps matches it`,
  );
}

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

  const result = replayPlaythrough(playthrough);
  if (result.failure != null) {
    throw new Error(
      `game ${playthrough.id} does not replay against the current engine, so ` +
        `it cannot be imported:\n  ${result.failure}`,
    );
  }

  const directory = join(directoryFor(playthrough.gameKey), "playthroughs");
  mkdirSync(directory, { recursive: true });
  const fixture = join(directory, `${playthrough.id}.json`);
  const transcript = join(directory, `${playthrough.id}.expected.txt`);

  if (existsSync(transcript) && !force) {
    const existing = readFileSync(transcript, "utf-8");
    if (existing !== result.transcript) {
      throw new Error(
        `${transcript} already exists and the game now plays out differently. ` +
          `Review the change, then re-run with --force to accept it.`,
      );
    }
  }

  writeFileSync(fixture, JSON.stringify(playthrough) + "\n");
  writeFileSync(transcript, result.transcript);
  // One test file per recording, so vitest can spread a growing corpus across
  // workers instead of replaying them serially in one file.
  writeFileSync(
    join(directory, `${playthrough.id}_test.ts`),
    `import { describePlaythrough } from "../../../testing/harness/playthrough_case";\n` +
      `\ndescribePlaythrough(__dirname, "${playthrough.id}");\n`,
  );

  /* eslint-disable no-console */
  console.log(`imported game ${playthrough.id} (${playthrough.gameKey})`);
  console.log(`  ${result.actionsApplied} actions replayed`);
  console.log(
    `  reached the end of the game: ${result.endedNaturally ? "yes" : "no"}`,
  );
  console.log(`  ${fixture.replace(resolve(__dirname, "../.."), ".")}`);
  console.log(`  ${transcript.replace(resolve(__dirname, "../.."), ".")}`);
  console.log(
    `  ${join(directory, `${playthrough.id}_test.ts`).replace(resolve(__dirname, "../.."), ".")}`,
  );
  /* eslint-enable no-console */
}

main();
