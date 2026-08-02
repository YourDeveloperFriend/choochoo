import { describe, expect, it } from "vitest";
import { EngineDelegator } from "../../engine/framework/engine";
import { injectGrid } from "../../engine/game/state";
import { MapSettings, Rotation } from "../../engine/game/map_settings";
import { VariantConfig } from "../../api/variant_config";
import { MapRegistry } from "../../maps/registry";
import { allLabels, coordinatesForLabel, labelForCoordinates } from "./labels";
import { ReadableGame, readGame } from "./read_game";

/**
 * Labels are how tests address the board, so a collision would silently drop
 * spaces from the index and a rotated map would resolve to the wrong hex. Both
 * are checked against every registered map.
 */

const REQUIRED_VARIANTS: Record<string, VariantConfig> = {
  ireland: { locoVariant: false },
  "puerto-rico": { difficulty: "versado" },
  reversteam: { baseRules: true },
};

function variantFor(settings: MapSettings): VariantConfig {
  if (settings.variantConfig == null) return {};
  return settings.variantConfig.parse(
    REQUIRED_VARIANTS[settings.key] ?? {},
  ) as VariantConfig;
}

function started(settings: MapSettings): ReadableGame {
  const variant = variantFor(settings);
  const state = EngineDelegator.singleton.start({
    game: { id: 1, gameKey: settings.key, variant },
    players: Array.from({ length: settings.minPlayers }, (_, index) => ({
      playerId: index + 1,
    })),
    seed: `labels-${settings.key}`,
  });
  return { gameKey: settings.key, gameData: state.gameData, variant };
}

const ALL_MAPS = [...MapRegistry.singleton.values()].sort((a, b) =>
  a.key < b.key ? -1 : 1,
);

describe("labels", () => {
  it("covers at least one rotated map, so rotation is actually exercised", () => {
    const rotated = ALL_MAPS.filter((m) => m.rotation != null);

    expect(rotated.length).toBeGreaterThan(0);
    expect(rotated.some((m) => m.rotation === Rotation.CLOCKWISE)).toBe(true);
  });

  for (const settings of ALL_MAPS) {
    describe(settings.key, () => {
      it("assigns a distinct label to every space", () => {
        const game = started(settings);
        const gridSize = readGame(
          game,
          () => [...injectGrid()().keys()].length,
        );

        // If two coordinates produced the same label, the index would be
        // smaller than the grid and some spaces would be unaddressable.
        expect(allLabels(game)).toHaveLength(gridSize);
      });

      it("round-trips every label through coordinates and back", () => {
        const game = started(settings);

        for (const label of allLabels(game)) {
          const coordinates = coordinatesForLabel(game, label);
          expect(labelForCoordinates(game, coordinates)).toBe(label);
        }
      });

      it("resolves labels to the same coordinates the grid displays", () => {
        const game = started(settings);
        const fromGrid = readGame(game, () => {
          const grid = injectGrid()();
          return [...grid.keys()].map(
            (coordinates) =>
              [
                grid.toDoubleHeightDisplay(coordinates).toString(),
                coordinates,
              ] as const,
          );
        });

        for (const [label, coordinates] of fromGrid) {
          expect(coordinatesForLabel(game, label)).toBe(coordinates);
        }
      });
    });
  }
});
