import { describe, expect, it } from "vitest";
import { ZodTypeAny } from "zod";
import { VariantConfig } from "../../api/variant_config";
import { MapRegistry } from "../../maps/registry";
import { EngineDelegator } from "../framework/engine";
import { MapSettings } from "./map_settings";
import { PlayerUser } from "./starter";
import { PlayerColor } from "../state/player";

/**
 * How much of starting a game is fixed by the seed.
 *
 * A regression corpus built from real games replays each one by starting from
 * its recorded seed and re-emitting its recorded actions, so anything setup
 * depends on that the seed does not fix would have to be captured separately.
 *
 * The engine uses no clock and no unseeded randomness, so the only input that is
 * not the seed is each player's colour preferences -- read from the users when
 * the game starts, and free to change afterwards. These tests pin down exactly
 * how far that reaches.
 *
 * The answer: preferences move which player gets which colour and nothing else.
 * The board is identical on every map. Players are otherwise interchangeable, so
 * a recorded game can be relabelled onto whatever assignment the seed produces
 * rather than having its colours captured.
 */

const REQUIRED_VARIANTS: Record<string, VariantConfig> = {
  ireland: { locoVariant: false },
  "puerto-rico": { difficulty: "versado" },
  reversteam: { baseRules: true },
};

/** Board state proper: everything not attached to a player. */
const BOARD_KEYS = ["grid", "bag", "availableCities", "interCityConnections"];

const ELIGIBLE: PlayerColor[] = [
  PlayerColor.RED,
  PlayerColor.BLUE,
  PlayerColor.YELLOW,
  PlayerColor.GREEN,
  PlayerColor.BROWN,
  PlayerColor.PINK,
];

/**
 * Every variant configuration worth checking for a map.
 *
 * Testing only the default configuration is not enough. Holland draws from the
 * generator for windmills, but only under its windmill variant, so a
 * default-only check reported it as independent of the players when it was not.
 * That is why the configurations are derived from the schema rather than listed
 * by hand: a new variant field is covered without anyone remembering to add it.
 *
 * Each field is exercised on its own, plus one configuration with all of them
 * set, which keeps this linear in the number of fields rather than exponential
 * while still catching interactions between them.
 */
function variantsToTest(
  settings: MapSettings,
): Array<{ label: string; config: VariantConfig }> {
  if (settings.variantConfig == null) {
    return [{ label: "no variants", config: {} }];
  }
  const base = REQUIRED_VARIANTS[settings.key] ?? {};
  const parse = (raw: object): VariantConfig =>
    settings.variantConfig!.parse(raw) as VariantConfig;

  const fields = variantFields(settings.key, settings.variantConfig);
  const configs = [{ label: "default", config: parse(base) }];

  for (const [field, values] of fields) {
    for (const value of values) {
      configs.push({
        label: `${field}=${String(value)}`,
        config: parse({ ...base, [field]: value }),
      });
    }
  }

  if (fields.length > 1) {
    const everything: Record<string, unknown> = { ...base };
    for (const [field, values] of fields) {
      everything[field] = values[values.length - 1];
    }
    configs.push({ label: "all variants", config: parse(everything) });
  }

  return configs;
}

/**
 * The values each field of a variant schema can take.
 *
 * Reads zod's internals, which is acceptable in a test and is the price of not
 * maintaining the list by hand. A field whose values cannot be enumerated throws
 * rather than being skipped, so an unusual new variant type is noticed.
 */
function variantFields(
  gameKey: string,
  schema: ZodTypeAny,
): Array<[string, unknown[]]> {
  const shape = (
    schema as unknown as {
      _def?: { typeName?: string; shape?: () => Record<string, ZodTypeAny> };
    }
  )._def;
  if (shape?.typeName !== "ZodObject" || shape.shape == null) {
    throw new Error(
      `${gameKey}: expected variantConfig to be a zod object, so its fields ` +
        `could be enumerated. Extend variantFields to cover it.`,
    );
  }

  return Object.entries(shape.shape()).map(([name, field]) => [
    name,
    valuesOf(gameKey, name, field),
  ]);
}

function valuesOf(gameKey: string, name: string, field: ZodTypeAny): unknown[] {
  let current = field;
  for (;;) {
    const def = (
      current as unknown as {
        _def?: {
          typeName?: string;
          innerType?: ZodTypeAny;
          values?: unknown[];
        };
      }
    )._def;
    if (def?.typeName === "ZodBoolean") return [true, false];
    if (def?.typeName === "ZodEnum") return [...(def.values ?? [])];
    if (def?.innerType != null) {
      current = def.innerType;
      continue;
    }
    throw new Error(
      `${gameKey}: cannot enumerate values for variant field "${name}". ` +
        `Extend valuesOf to cover its type.`,
    );
  }
}

interface StartedState {
  players: Array<{ playerId: number; color: PlayerColor }>;
  turnOrder: PlayerColor[];
  [key: string]: unknown;
}

function start(
  settings: MapSettings,
  players: PlayerUser[],
  seed: string,
  variant: VariantConfig,
): StartedState {
  const state = EngineDelegator.singleton.start({
    game: { id: 1, gameKey: settings.key, variant },
    players,
    seed,
  });
  return JSON.parse(state.gameData).gameData as StartedState;
}

function board(state: StartedState): string {
  return JSON.stringify(BOARD_KEYS.map((key) => state[key]));
}

const ALL_MAPS = [...MapRegistry.singleton.values()].sort((a, b) =>
  a.key < b.key ? -1 : 1,
);

describe("game start is seed-determined", () => {
  for (const settings of ALL_MAPS) {
    describe(settings.key, () => {
      const ids = Array.from(
        { length: settings.minPlayers },
        (_, index) => index + 1,
      );
      const noPreferences: PlayerUser[] = ids.map((playerId) => ({ playerId }));
      const allPreferences: PlayerUser[] = ids.map((playerId, index) => ({
        playerId,
        preferredColors: [ELIGIBLE[index % ELIGIBLE.length]],
      }));
      const reversedIds: PlayerUser[] = ids
        .slice()
        .reverse()
        .map((playerId) => ({ playerId }));
      const seed = `determinism-${settings.key}`;
      const variants = variantsToTest(settings);
      const defaultVariant = variants[0].config;

      it("produces the same state twice from the same seed", () => {
        expect(start(settings, noPreferences, seed, defaultVariant)).toEqual(
          start(settings, noPreferences, seed, defaultVariant),
        );
      });

      it("deals a different board for a different seed", () => {
        expect(
          board(
            start(settings, noPreferences, `${seed}-other`, defaultVariant),
          ),
        ).not.toBe(board(start(settings, noPreferences, seed, defaultVariant)));
      });

      it("deals the same board whatever the player ids are", () => {
        expect(board(start(settings, reversedIds, seed, defaultVariant))).toBe(
          board(start(settings, noPreferences, seed, defaultVariant)),
        );
      });

      it("deals the same colours and turn order whatever the player ids are", () => {
        // Colours are handed out in player order, so which id holds which
        // colour moves; the sequence dealt and the turn order do not. That is
        // what lets a recorded game be relabelled onto a fresh start.
        const reversed = start(settings, reversedIds, seed, defaultVariant);
        const forward = start(settings, noPreferences, seed, defaultVariant);

        expect(reversed.players.map((player) => player.color)).toEqual(
          forward.players.map((player) => player.color),
        );
        expect(reversed.turnOrder).toEqual(forward.turnOrder);
      });

      // Checked under every variant, not just the default. Holland only draws
      // for the board under its windmill variant, so a default-only check
      // reported it as independent of the players when it was not.
      for (const { label, config } of variants) {
        it(`deals the same board whatever the colour preferences are (${label})`, () => {
          expect(board(start(settings, allPreferences, seed, config))).toBe(
            board(start(settings, noPreferences, seed, config)),
          );
        });
      }
    });
  }
});
