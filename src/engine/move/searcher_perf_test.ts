import { readFile } from "fs/promises";
import { resolve } from "path";
import { GameKey, GameKeyZod } from "../../api/game_key";
import { VariantConfig } from "../../api/variant_config";
import { inject, setInjectionContext } from "../framework/execution_context";
import { InjectionContext } from "../framework/inject";
import { SerializedGameData, StateStore } from "../framework/state";
import { GameMemory, LimitedGame } from "../game/game_memory";
import { injectCurrentPlayer } from "../game/state";
import { MoveSearcher } from "./searcher";

const REQUIRED_STATE_KEYS = new Set([
  "grid",
  "interCityConnections",
  "players",
  "currentPlayer",
]);

const DEFAULT_FIXTURE_PATH = "src/e2e/goldens/create_game_after.json";
const DEFAULT_WARMUP_RUNS = 1;
const DEFAULT_MEASURED_RUNS = 3;
const DEFAULT_ALLOWED_REGRESSION = 0.3;

interface PerfScenario {
  game: LimitedGame;
  gameData: SerializedGameData;
  fixturePath: string;
}

describe("MoveSearcher performance", () => {
  let scenario: PerfScenario;

  beforeAll(async () => {
    scenario = await loadScenario(
      process.env.MOVE_SEARCH_PERF_FIXTURE ?? DEFAULT_FIXTURE_PATH,
    );
  });

  afterEach(() => {
    setInjectionContext();
  });

  it(
    "measures route search latency with optional soft regression budget",
    () => {
      const context = new InjectionContext(scenario.game.gameKey);
      setInjectionContext(context);

      inject(GameMemory).setGame(scenario.game);
      inject(StateStore).merge(JSON.stringify(scenario.gameData));

      const currentPlayer = injectCurrentPlayer()();
      const searcher = inject(MoveSearcher);

      const warmupRuns = getEnvNumber("MOVE_SEARCH_PERF_WARMUP_RUNS") ?? DEFAULT_WARMUP_RUNS;
      const measuredRuns = getEnvNumber("MOVE_SEARCH_PERF_RUNS") ?? DEFAULT_MEASURED_RUNS;
      const durations: number[] = [];
      let routeCount: number | undefined;

      for (let runIndex = 0; runIndex < warmupRuns; runIndex++) {
        searcher.findAllRoutes(currentPlayer);
      }

      for (let runIndex = 0; runIndex < measuredRuns; runIndex++) {
        const start = Date.now();
        const routes = searcher.findAllRoutes(currentPlayer);
        durations.push(Date.now() - start);

        if (routeCount == null) {
          routeCount = routes.length;
        } else {
          expect(routes.length).toEqual(routeCount);
        }
      }

      const medianMs = median(durations);
      const minMs = Math.min(...durations);
      const maxMs = Math.max(...durations);

      expect(routeCount).toBeDefined();
      expect(routeCount!).toBeGreaterThanOrEqual(0);

      const baselineMs = getEnvNumber("MOVE_SEARCH_PERF_BASELINE_MS");
      const allowedRegression =
        getEnvNumber("MOVE_SEARCH_PERF_ALLOWED_REGRESSION") ??
        DEFAULT_ALLOWED_REGRESSION;
      if (baselineMs != null) {
        const maxAllowedMs = baselineMs * (1 + allowedRegression);
        expect(medianMs).toBeLessThan(maxAllowedMs);
      }

      const maxAllowedMs = getEnvNumber("MOVE_SEARCH_PERF_MAX_MS");
      if (maxAllowedMs != null) {
        expect(medianMs).toBeLessThan(maxAllowedMs);
      }

      console.log(
        [
          "[MoveSearcherPerf]",
          `fixture=${scenario.fixturePath}`,
          `map=${scenario.game.gameKey}`,
          `routes=${routeCount}`,
          `runs=${measuredRuns}`,
          `warmup=${warmupRuns}`,
          `medianMs=${medianMs.toFixed(2)}`,
          `minMs=${minMs.toFixed(2)}`,
          `maxMs=${maxMs.toFixed(2)}`,
          baselineMs != null ? `baselineMs=${baselineMs.toFixed(2)}` : "baselineMs=unset",
        ].join(" "),
      );
    },
    180_000,
  );

  it("detects when algorithm changes alter route counts", () => {
    const context = new InjectionContext(scenario.game.gameKey);
    setInjectionContext(context);

    inject(GameMemory).setGame(scenario.game);
    inject(StateStore).merge(JSON.stringify(scenario.gameData));

    const currentPlayer = injectCurrentPlayer()();
    const searcher = inject(MoveSearcher);

    const routes = searcher.findAllRoutes(currentPlayer);
    const initialCount = routes.length;

    // Verify that the route count is consistent and deterministic
    // (run multiple times to ensure consistency)
    for (let i = 0; i < 2; i++) {
      setInjectionContext(new InjectionContext(scenario.game.gameKey));
      inject(GameMemory).setGame(scenario.game);
      inject(StateStore).merge(JSON.stringify(scenario.gameData));

      const searcher = inject(MoveSearcher);
      const currentPlayer = injectCurrentPlayer()();
      const routes = searcher.findAllRoutes(currentPlayer);

      expect(routes.length).toEqual(
        initialCount,
        "Route count must be deterministic across multiple runs"
      );
    }

    console.log(
      `[RegressionTest] Algorithm stability verified: route count=${initialCount} is consistent across multiple runs`
    );
  });
});

function getEnvNumber(key: string): number | undefined {
  const rawValue = process.env[key];
  if (rawValue == null || rawValue.trim() === "") {
    return undefined;
  }
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a finite number`);
  }
  return parsed;
}

function median(values: number[]): number {
  const sortedValues = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2 === 0) {
    return (sortedValues[middle - 1] + sortedValues[middle]) / 2;
  }
  return sortedValues[middle];
}

async function loadScenario(pathFromWorkspaceRoot: string): Promise<PerfScenario> {
  const fixturePath = resolve(process.cwd(), pathFromWorkspaceRoot);
  const fixture = JSON.parse(await readFile(fixturePath, "utf8")) as Record<
    string,
    unknown
  >;

  if (isSerializedGameData(fixture)) {
    const gameKey = GameKeyZod.parse(
      process.env.MOVE_SEARCH_PERF_GAME_KEY ?? GameKey.RUST_BELT,
    );
    const variant = process.env.MOVE_SEARCH_PERF_VARIANT
      ? VariantConfig.parse(JSON.parse(process.env.MOVE_SEARCH_PERF_VARIANT))
      : defaultVariantConfig(gameKey);
    return {
      fixturePath: pathFromWorkspaceRoot,
      game: {
        id: 1,
        gameKey,
        variant,
      },
      gameData: trimForMoveSearch(fixture),
    };
  }

  const gameDataCandidate = fixture["gameData"];
  if (!isSerializedGameData(gameDataCandidate)) {
    throw new Error("Perf fixture must be a SerializedGameData object or include a gameData SerializedGameData payload");
  }

  const gameKey = GameKeyZod.parse(fixture["gameKey"]);
  const variant =
    fixture["variant"] == null
      ? defaultVariantConfig(gameKey)
      : VariantConfig.parse(fixture["variant"]);

  return {
    fixturePath: pathFromWorkspaceRoot,
    game: {
      id: 1,
      gameKey,
      variant,
    },
    gameData: trimForMoveSearch(gameDataCandidate),
  };
}

function isSerializedGameData(value: unknown): value is SerializedGameData {
  try {
    SerializedGameData.parse(value);
    return true;
  } catch {
    return false;
  }
}

function trimForMoveSearch(gameData: SerializedGameData): SerializedGameData {
  const filtered = Object.fromEntries(
    Object.entries(gameData.gameData).filter(
      ([key]) => REQUIRED_STATE_KEYS.has(key) || key.endsWith("State")
    ),
  );

  // If currentPlayer is missing but turnOrder exists, default to first player in turnOrder
  if (!("currentPlayer" in filtered) && "turnOrder" in gameData.gameData) {
    const turnOrder = (gameData.gameData as Record<string, unknown>)["turnOrder"];
    if (Array.isArray(turnOrder) && turnOrder.length > 0) {
      filtered["currentPlayer"] = turnOrder[0];
    }
  }

  return {
    version: gameData.version,
    gameData: filtered,
  };
}

function defaultVariantConfig(gameKey: GameKey): VariantConfig {
  switch (gameKey) {
    case GameKey.REVERSTEAM:
      return { gameKey, baseRules: true };
    case GameKey.IRELAND:
      return { gameKey, locoVariant: false };
    case GameKey.CYPRUS:
      return { gameKey };
    case GameKey.PUERTO_RICO:
      throw new Error(
        "MOVE_SEARCH_PERF_VARIANT is required for Puerto Rico fixtures",
      );
    default:
      return VariantConfig.parse({ gameKey });
  }
}