import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { MapRegistry } from "../maps/registry";
import { Playthrough } from "../testing/harness/playthrough";

/**
 * Where recorded playthroughs live on disk, and how they get there.
 *
 * Shared by the two ways a recording is created: importing a single export by
 * hand (import_playthrough) and collecting one per map from production
 * (collect_playthroughs).
 */

/**
 * The source directory a map lives in.
 *
 * Game keys are no guide to this: "detroit-bankruptcy" lives in detroit,
 * "india" in india-steam-brothers, "SwedenRecycling" in sweden. The generated
 * registry is the one place that already knows, since it imports every map's
 * settings by path, so the mapping is read back out of it.
 */
export function directoryFor(gameKey: string): string {
  const settings = [...MapRegistry.singleton.values()].find(
    (candidate) => candidate.key === gameKey,
  );
  if (settings == null) {
    throw new Error(`no registered map with key "${gameKey}"`);
  }

  const className = settings.constructor.name;
  const directory = registryDirectories().get(className);
  if (directory == null) {
    throw new Error(
      `${className} (map "${gameKey}") is not imported by src/maps/registry.ts. ` +
        `Try 'npm run generate'.`,
    );
  }

  const path = join(resolve(__dirname, "../maps"), directory);
  if (!existsSync(path)) {
    throw new Error(`registry points map "${gameKey}" at missing ${path}`);
  }
  return path;
}

let directories: Map<string, string> | undefined;

/** Settings class name to map directory, read from the generated registry. */
function registryDirectories(): Map<string, string> {
  if (directories != null) return directories;

  const source = readFileSync(
    resolve(__dirname, "../maps/registry.ts"),
    "utf-8",
  );
  directories = new Map();
  const pattern = /import\s*\{\s*(\w+)\s*\}\s*from\s*"\.\/([^/"]+)\/settings"/g;
  for (const match of source.matchAll(pattern)) {
    directories.set(match[1], match[2]);
  }
  if (directories.size === 0) {
    throw new Error(
      "found no map settings imports in src/maps/registry.ts; has its format changed?",
    );
  }
  return directories;
}

export function playthroughDirectory(gameKey: string): string {
  return join(directoryFor(gameKey), "playthroughs");
}

export interface WrittenPlaythrough {
  fixture: string;
  transcript: string;
  stub: string;
}

/**
 * Writes a recording, its transcript, and the test that runs it.
 *
 * Refuses to replace a transcript that has changed unless forced: a changed
 * transcript means the game now plays out differently, which is the thing these
 * tests exist to catch, so it wants reviewing rather than silently accepting.
 */
export function writePlaythrough(
  prepared: Playthrough,
  transcript: string,
  force: boolean,
): WrittenPlaythrough {
  const directory = playthroughDirectory(prepared.gameKey);
  mkdirSync(directory, { recursive: true });

  const paths: WrittenPlaythrough = {
    fixture: join(directory, `${prepared.id}.json`),
    transcript: join(directory, `${prepared.id}.expected.txt`),
    // One test file per recording, so vitest can spread a growing corpus across
    // workers instead of replaying them serially in one file.
    stub: join(directory, `${prepared.id}_test.ts`),
  };

  if (existsSync(paths.transcript) && !force) {
    const existing = readFileSync(paths.transcript, "utf-8");
    if (existing !== transcript) {
      throw new Error(
        `${paths.transcript} already exists and the game now plays out ` +
          `differently. Review the change, then re-run with --force to accept it.`,
      );
    }
  }

  writeFileSync(paths.fixture, JSON.stringify(prepared) + "\n");
  writeFileSync(paths.transcript, transcript);
  writeFileSync(
    paths.stub,
    `import { describePlaythrough } from "../../../testing/harness/playthrough_case";\n` +
      `\ndescribePlaythrough(__dirname, "${prepared.id}");\n`,
  );

  return paths;
}

/** Trims an absolute path down to a repository-relative one, for logging. */
export function relative(path: string): string {
  return path.replace(resolve(__dirname, "../.."), ".");
}
