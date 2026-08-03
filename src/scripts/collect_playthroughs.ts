import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
// Imported first: the engine and the map registry form an import cycle, and
// whichever side loads first wins. See src/testing/setup.ts.
import "../maps/registry";
import { GameKey } from "../api/game_key";
import { ReleaseStage } from "../engine/game/map_settings";
import { MapRegistry } from "../maps/registry";
import {
  Playthrough,
  prepareForReplay,
  replayPlaythrough,
} from "../testing/harness/playthrough";
import {
  playthroughDirectory,
  relative,
  writePlaythrough,
} from "./playthrough_files";

/**
 * Collects one recorded playthrough per map from production.
 *
 *   npm run playthrough:collect -- [--maps a,b] [--candidates 12] [--force]
 *                                 [--cookie admin_cookie.txt] [--dry-run]
 *
 * For each map without a recording, walks its finished games newest-first and
 * takes the first that replays cleanly against the current engine. Most
 * candidates are rejected, for reasons worth knowing about:
 *
 *   - abandoned or kicked. Both mark a game degenerate, and the eliminations
 *     they inject are not player actions, so such a game cannot be replayed.
 *   - conceded. A concession ends a game without being an action either, so the
 *     recording would stop short of the result.
 *   - too old to parse. A game whose stored opening predates a state format
 *     change no longer loads, because production only migrated the current
 *     state of each game and not its history.
 *   - no longer legal. A rules change since the game was played. Worth reading
 *     closely if it happens on a recent game: that is the same signal the
 *     committed corpus exists to raise.
 *
 * Maps are skipped, not failed, when nothing qualifies -- a map may simply have
 * no finished games. Whatever gets skipped is listed at the end.
 *
 * Maps with variants are handled per distinct variant configuration, since a
 * variant can change the rules enough to be worth its own recording.
 */

const HOST = process.env.CHOOCHOO_API_HOST ?? "https://api.choochoo.games";

interface Options {
  maps?: string[];
  candidates: number;
  force: boolean;
  dryRun: boolean;
  cookiePath: string;
}

function parseOptions(argv: string[]): Options {
  const options: Options = {
    candidates: 12,
    force: false,
    dryRun: false,
    cookiePath: "admin_cookie.txt",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--force") options.force = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--maps") options.maps = argv[++i].split(",");
    else if (arg === "--candidates") options.candidates = Number(argv[++i]);
    else if (arg === "--cookie") options.cookiePath = argv[++i];
    else throw new Error(`unrecognized argument "${arg}"`);
  }
  return options;
}

/** A game list entry, reduced to what choosing a candidate needs. */
interface Candidate {
  id: number;
  gameKey: string;
  variant: Record<string, unknown>;
  degenerate: boolean;
  playerIds: number[];
}

/** Exponential backoff between retries. */
function pause(attempt: number): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, 500 * 2 ** (attempt - 1)),
  );
}

class Api {
  constructor(private readonly cookie: string) {}

  /**
   * Fetches JSON, retrying transient failures.
   *
   * A collection run makes hundreds of requests over many minutes, so it
   * reliably meets a keep-alive connection the server has closed, or a 502 from
   * a deploy. Left unhandled, one of those ends the whole run and discards the
   * work done so far.
   */
  private async get(path: string): Promise<unknown> {
    const attempts = 4;
    for (let attempt = 1; ; attempt++) {
      try {
        const response = await fetch(`${HOST}${path}`, {
          headers: { cookie: `connect.sid=${this.cookie}` },
        });
        if (response.status >= 500 && attempt < attempts) {
          await pause(attempt);
          continue;
        }
        if (!response.ok) {
          throw new Error(
            `GET ${path} returned ${response.status}: ` +
              (await response.text()).slice(0, 200),
          );
        }
        return await response.json();
      } catch (e) {
        // A thrown fetch is a transport failure; a non-2xx is already handled
        // above and rethrown here unchanged once retries run out.
        if (attempt >= attempts || !(e instanceof TypeError)) throw e;
        await pause(attempt);
      }
    }
  }

  /** Finished games for a map, newest first. */
  async *endedGames(gameKey: string): AsyncGenerator<Candidate> {
    let cursor: string | undefined;
    for (;;) {
      const query = new URLSearchParams({ gameKey, pageSize: "20" });
      query.append("status[]", "ENDED");
      if (cursor != null) query.set("pageCursor", cursor);

      const body = (await this.get(`/api/games?${query}`)) as {
        games: Candidate[];
        nextPageCursor?: string;
      };
      for (const game of body.games) yield game;
      if (body.nextPageCursor == null || body.games.length === 0) return;
      cursor = body.nextPageCursor;
    }
  }

  /** True if nobody conceded. Concessions end a game without being actions. */
  async wasPlayedOut(gameId: number): Promise<boolean> {
    const body = (await this.get(`/api/games/${gameId}`)) as {
      game: { concedingPlayers: number[] };
    };
    return body.game.concedingPlayers.length === 0;
  }

  async export(gameId: number): Promise<Playthrough> {
    const body = (await this.get(`/api/games/${gameId}/export`)) as {
      game: Playthrough;
    };
    return body.game;
  }
}

/**
 * A variant configuration reduced to a comparable key.
 *
 * Older games stored the map's own key inside the variant blob, so the same
 * configuration reads as {"gameKey":"germany"} on an old game and {} on a new
 * one. That is a storage artifact rather than a rules difference, and taking it
 * at face value means recording the same variant twice. Keys are sorted for the
 * same reason: property order is not meaningful.
 */
function variantKey(variant: Record<string, unknown> | undefined): string {
  const entries = Object.entries(variant ?? {})
    .filter(([key]) => key !== "gameKey")
    .sort(([a], [b]) => (a < b ? -1 : 1));
  return JSON.stringify(Object.fromEntries(entries));
}

/** The variant configurations already covered by a committed recording. */
function existingVariants(gameKey: string): Set<string> {
  const directory = playthroughDirectory(gameKey);
  if (!existsSync(directory)) return new Set();
  return new Set(
    readdirSync(directory)
      .filter((name) => name.endsWith(".json"))
      .map((name) => {
        const recording = JSON.parse(
          readFileSync(join(directory, name), "utf-8"),
        ) as Playthrough;
        return variantKey(recording.variant);
      }),
  );
}

interface Outcome {
  gameKey: string;
  variant: string;
  gameId?: number;
  status: "recorded" | "already covered" | "skipped";
  detail: string;
}

/** Tries to turn one candidate game into a recording. */
async function attempt(
  api: Api,
  candidate: Candidate,
  options: Options,
): Promise<{ ok: true; outcome: Outcome } | { ok: false; reason: string }> {
  if (!(await api.wasPlayedOut(candidate.id))) {
    return { ok: false, reason: "a player conceded" };
  }

  let playthrough: Playthrough;
  try {
    playthrough = await api.export(candidate.id);
  } catch (e) {
    return { ok: false, reason: `export failed: ${short(e)}` };
  }

  if (playthrough.startState == null) {
    return { ok: false, reason: "no recorded opening" };
  }

  let prepared: Playthrough;
  let result: ReturnType<typeof replayPlaythrough>;
  try {
    prepared = prepareForReplay(playthrough);
    result = replayPlaythrough(prepared);
  } catch (e) {
    // Most often an opening that no longer parses, which is a data-age problem
    // rather than a rules problem.
    return { ok: false, reason: `replay threw: ${short(e)}` };
  }

  if (result.failure != null) {
    return { ok: false, reason: result.failure };
  }
  if (!result.endedNaturally) {
    return {
      ok: false,
      reason: `replayed all ${result.actionsApplied} actions without reaching the end`,
    };
  }

  const detail =
    `${result.actionsApplied} actions, ${prepared.playerIds.length} players, ` +
    `from ${prepared.replayFrom}`;
  if (!options.dryRun) {
    writePlaythrough(prepared, result.transcript, options.force);
  }
  return {
    ok: true,
    outcome: {
      gameKey: candidate.gameKey,
      variant: variantKey(candidate.variant),
      gameId: candidate.id,
      status: "recorded",
      detail,
    },
  };
}

/**
 * Condenses an error down to one readable line.
 *
 * Zod reports a JSON array of issues spread over many lines, whose first line is
 * just "[", so taking the first line loses the whole message.
 */
function short(e: unknown): string {
  const message = (e as Error).message;
  if (message.trimStart().startsWith("[")) {
    try {
      const described = describeZodIssues(
        JSON.parse(message) as ZodIssue[],
        [],
      );
      if (described.length > 0) return described.join("; ").slice(0, 200);
    } catch {
      // Not the zod shape after all; fall through to the plain first line.
    }
  }
  return message.split("\n")[0].slice(0, 200);
}

interface ZodIssue {
  code?: string;
  path?: unknown[];
  message?: string;
  unionErrors?: Array<{ issues: ZodIssue[] }>;
}

/**
 * Flattens zod issues into "path: message" lines.
 *
 * A union reports every branch it tried, which for a grid space means one
 * failure per kind of space and buries the real mismatch. Only the branch that
 * came closest -- the one with the fewest complaints -- is followed, which lands
 * on the space the data actually is.
 */
function describeZodIssues(issues: ZodIssue[], prefix: unknown[]): string[] {
  const lines: string[] = [];
  for (const issue of issues) {
    const path = [...prefix, ...(issue.path ?? [])];
    if (issue.unionErrors != null && issue.unionErrors.length > 0) {
      const closest = issue.unionErrors.reduce((best, branch) =>
        branch.issues.length < best.issues.length ? branch : best,
      );
      lines.push(...describeZodIssues(closest.issues, path));
    } else {
      lines.push(`${path.join(".") || "(root)"}: ${issue.message}`);
    }
  }
  return [...new Set(lines)].slice(0, 4);
}

async function collectMap(
  api: Api,
  gameKey: string,
  options: Options,
): Promise<Outcome[]> {
  const covered = existingVariants(gameKey);
  const outcomes: Outcome[] = [];
  const rejections: string[] = [];
  let examined = 0;

  for (const variant of covered) {
    outcomes.push({
      gameKey,
      variant,
      status: "already covered",
      detail: "a recording for this variant is already committed",
    });
  }

  // A map without variants needs exactly one recording, so once it has one there
  // is nothing to look for. Worth short-circuiting: otherwise every finished game
  // the map ever had gets listed and discarded one page at a time.
  const hasVariants =
    MapRegistry.singleton.get(gameKey as GameKey).variantConfig != null;
  if (covered.size > 0 && !hasVariants) return outcomes;

  for await (const candidate of api.endedGames(gameKey)) {
    if (examined >= options.candidates) break;

    const variant = variantKey(candidate.variant);
    if (covered.has(variant)) continue;
    if (candidate.degenerate) continue;
    examined++;

    const attempted = await attempt(api, candidate, options);
    if (attempted.ok) {
      log(
        `  ${gameKey}: recorded game ${candidate.id} (${attempted.outcome.detail})`,
      );
      outcomes.push(attempted.outcome);
      covered.add(variant);
      continue;
    }
    rejections.push(`game ${candidate.id}: ${attempted.reason}`);
  }

  // A map that was already covered before this run is not a gap, so it is not
  // reported as one -- only a map that ends the run with nothing at all.
  if (outcomes.length === 0) {
    const detail =
      rejections.length === 0
        ? "no finished, non-degenerate games"
        : `${rejections.length} candidate(s) rejected; last: ${rejections[rejections.length - 1]}`;
    log(`  ${gameKey}: skipped -- ${detail}`);
    if (rejections.length > 0) {
      for (const rejection of rejections) log(`      ${rejection}`);
    }
    outcomes.push({ gameKey, variant: "*", status: "skipped", detail });
  }

  return outcomes;
}

function log(message: string): void {
  // eslint-disable-next-line no-console
  console.log(message);
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));

  const cookie = readFileSync(options.cookiePath, "utf-8").trim();
  const api = new Api(cookie);

  const all = [...MapRegistry.singleton.values()]
    // Development maps are excluded on purpose: their rules are still moving, so
    // a recording would be pinning down something not yet decided.
    .filter((settings) => settings.stage !== ReleaseStage.DEVELOPMENT)
    .map((settings) => settings.key)
    .sort();

  const keys = options.maps ?? all;
  for (const key of keys) {
    if (!all.includes(key)) {
      throw new Error(
        `"${key}" is not a registered non-development map. Choose from:\n  ${all.join(", ")}`,
      );
    }
  }

  log(`collecting playthroughs for ${keys.length} map(s) from ${HOST}`);
  const outcomes: Outcome[] = [];
  for (const key of keys) {
    try {
      outcomes.push(...(await collectMap(api, key, options)));
    } catch (e) {
      // One map failing should not discard the recordings already collected.
      log(`  ${key}: failed -- ${short(e)}`);
      outcomes.push({
        gameKey: key,
        variant: "*",
        status: "skipped",
        detail: `collection failed: ${short(e)}`,
      });
    }
  }

  const recorded = outcomes.filter((o) => o.status === "recorded");
  const skipped = outcomes.filter((o) => o.status === "skipped");
  log("");
  log(
    `recorded ${recorded.length}, already covered ` +
      `${outcomes.filter((o) => o.status === "already covered").length}, ` +
      `skipped ${skipped.length}`,
  );
  for (const outcome of recorded) {
    log(`  ${outcome.gameKey} ${outcome.gameId}: ${outcome.detail}`);
  }
  if (skipped.length > 0) {
    log("");
    log("no recording for:");
    for (const outcome of skipped) {
      log(`  ${outcome.gameKey}: ${outcome.detail}`);
    }
  }
  if (options.dryRun) log("\n(dry run: nothing written)");
  else if (recorded.length > 0) {
    log(
      `\nwrote into ${relative(playthroughDirectory(recorded[0].gameKey))} and siblings`,
    );
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
