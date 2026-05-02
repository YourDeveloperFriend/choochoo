import { mkdir, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { parseArgs } from "util";
import { GameKey, GameKeyZod } from "../api/game_key";
import { VariantConfig } from "../api/variant_config";
import { SerializedGameData } from "../engine/framework/state";

interface ParsedArgs {
  gameId: number;
  outputPath: string;
  source: "auto" | "db" | "api";
  apiOrigin: string;
}

interface PerfFixture {
  gameKey: GameKey;
  variant: VariantConfig;
  gameData: SerializedGameData;
}

const HELP_MESSAGE = `
Usage:
  ts-node src/scripts/export_game_fixture.ts --game-id <id> [--output <path>]

Examples:
  ts-node src/scripts/export_game_fixture.ts --game-id 716
  ts-node src/scripts/export_game_fixture.ts --game-id 716 --output src/e2e/goldens/move_perf_716.json
  ts-node src/scripts/export_game_fixture.ts --game-id 716 --source api --api-origin https://api.choochoo.games
`;

let closeDatabase: (() => Promise<void>) | undefined;

if (resolve(process.argv[1]) === resolve(__filename)) {
  main().catch(async (error: unknown) => {
    console.error(error);
    await closeDatabase?.();
    process.exit(1);
  });
}

async function main() {
  const args = parseCliArgs();
  process.env.NODE_ENV ??= "development";

  const fixture =
    args.source === "db"
      ? await loadFromDb(args.gameId)
      : args.source === "api"
        ? await loadFromApi(args.apiOrigin, args.gameId)
        : await loadFromAuto(args.apiOrigin, args.gameId);

  const outputPath = resolve(process.cwd(), args.outputPath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(fixture, null, 2), "utf8");

  await closeDatabase?.();
  closeDatabase = undefined;

  console.log(
    `Exported game ${args.gameId} fixture to ${args.outputPath} (map=${fixture.gameKey}, source=${args.source})`,
  );
}

async function loadFromAuto(
  apiOrigin: string,
  gameId: number,
): Promise<PerfFixture> {
  if (hasDatabaseEnvironment()) {
    try {
      return await loadFromDb(gameId);
    } catch (e) {
      console.warn(
        `DB export failed, falling back to API export: ${toErrorMessage(e)}`,
      );
    }
  }
  return loadFromApi(apiOrigin, gameId);
}

async function loadFromDb(gameId: number): Promise<PerfFixture> {
  loadTestEnvironmentFileIfNeeded();

  const { connectToSequelize, sequelize } = require("../server/sequelize");
  const { GameDao } = require("../server/game/dao");

  closeDatabase = () => sequelize.close();

  await connectToSequelize();

  const game = await GameDao.findByPk(gameId);
  if (game == null) {
    throw new Error(`Game ${gameId} not found`);
  }
  if (game.gameData == null) {
    throw new Error(`Game ${gameId} has no gameData`);
  }

  return {
    gameKey: game.gameKey,
    variant: game.variant,
    gameData: SerializedGameData.parse(JSON.parse(game.gameData)),
  };
}

async function loadFromApi(apiOrigin: string, gameId: number): Promise<PerfFixture> {
  const baseUrl = apiOrigin.replace(/\/$/, "");

  // Fetch XSRF token (required for API authentication)
  const xsrfResponse = await fetch(`${baseUrl}/api/xsrf`, {
    credentials: "include",
  });
  const xsrfBody = (await xsrfResponse.json()) as { xsrfToken?: string };
  const xsrfToken = xsrfBody.xsrfToken;

  if (!xsrfToken) {
    throw new Error("Failed to obtain XSRF token from API");
  }

  // Fetch game with XSRF token
  const url = `${baseUrl}/api/games/${gameId}`;
  const response = await fetch(url, {
    headers: {
      "xsrf-token": xsrfToken,
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      `API export failed for game ${gameId}: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as {
    game?: {
      gameKey?: unknown;
      variant?: unknown;
      gameData?: unknown;
    };
  };

  const game = body.game;
  if (game == null) {
    throw new Error("API response is missing game payload");
  }

  if (typeof game.gameData !== "string" || game.gameData.trim() === "") {
    throw new Error("API response did not include serialized gameData");
  }

  return {
    gameKey: GameKeyZod.parse(game.gameKey),
    variant: VariantConfig.parse(game.variant),
    gameData: SerializedGameData.parse(JSON.parse(game.gameData)),
  };
}

function hasDatabaseEnvironment(): boolean {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_PASS ||
      process.env.POSTGRES_HOST,
  );
}

function loadTestEnvironmentFileIfNeeded(): void {
  if (hasDatabaseEnvironment()) return;

  const fs = require("fs") as typeof import("fs");
  const envPath = resolve(process.cwd(), ".testenv.sh");
  if (!fs.existsSync(envPath)) return;

  const contents = fs.readFileSync(envPath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const unexported = line.startsWith("export ")
      ? line.slice("export ".length).trim()
      : line;
    const separatorIndex = unexported.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = unexported.slice(0, separatorIndex).trim();
    const valueRaw = unexported.slice(separatorIndex + 1).trim();
    if (key === "" || process.env[key] != null) continue;

    const quote = valueRaw.charAt(0);
    const hasQuote = (quote === '"' || quote === "'") && valueRaw.endsWith(quote);
    const value = hasQuote
      ? valueRaw.slice(1, valueRaw.length - 1)
      : valueRaw;
    process.env[key] = value;
  }
}

function parseCliArgs(): ParsedArgs {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      "game-id": { type: "string", short: "g" },
      output: { type: "string", short: "o" },
      source: { type: "string", short: "s" },
      "api-origin": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    strict: false,
    allowPositionals: true,
  });

  if (values.help) {
    console.log(HELP_MESSAGE.trim());
    process.exit(0);
  }

  const rawGameId =
    getStringOption(values["game-id"]) ?? getStringOption(positionals[0]);
  const gameId = Number(rawGameId);
  if (
    rawGameId == null ||
    rawGameId.trim() === "" ||
    !Number.isInteger(gameId) ||
    gameId <= 0
  ) {
    throw new Error(
      "Missing or invalid --game-id. Use a positive integer.\n" +
        HELP_MESSAGE.trim(),
    );
  }

  const outputPath =
    getStringOption(values.output)?.trim() ||
    getStringOption(positionals[1]) ||
    `src/e2e/goldens/move_perf_game_${gameId}.json`;

  const sourceRaw =
    getStringOption(values.source)?.trim().toLowerCase() ?? "auto";
  if (sourceRaw !== "auto" && sourceRaw !== "db" && sourceRaw !== "api") {
    throw new Error("Invalid --source. Expected one of: auto, db, api");
  }

  const apiOrigin =
    getStringOption(values["api-origin"])?.trim() ||
    "https://api.choochoo.games";

  return {
    gameId,
    outputPath,
    source: sourceRaw,
    apiOrigin,
  };
}

function getStringOption(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : `${error}`;
}
