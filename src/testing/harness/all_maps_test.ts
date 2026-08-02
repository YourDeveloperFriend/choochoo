import { describe, expect, it } from "vitest";
import { VariantConfig } from "../../api/variant_config";
import { EngineDelegator } from "../../engine/framework/engine";
import { MapSettings } from "../../engine/game/map_settings";
import { MapRegistry } from "../../maps/registry";
import { formatSnapshot } from "./format";
import { checkSnapshot } from "./referee";
import { snapshotGame } from "./snapshot";

/**
 * The projection and the referee are shared infrastructure, so they have to hold
 * for every registered map -- not just the vanilla ones. This is a narrow slice of
 * the eventual conformance suite: it starts each map and checks the projection,
 * without playing any actions.
 *
 * Note this deliberately does NOT use ViewRegistry to source variant defaults,
 * even though the view layer knows them. `src/maps/view_registry.ts` transitively
 * imports client code that touches `window` at module scope, and the engine tier
 * must stay usable without a DOM.
 */

/**
 * Variant values for maps whose `variantConfig` has required fields. Anything
 * absent here is expected to parse from `{}`; if it doesn't, the test below fails
 * with instructions rather than quietly skipping the map.
 */
const REQUIRED_VARIANTS: Record<string, VariantConfig> = {
  ireland: { locoVariant: false },
  "puerto-rico": { difficulty: "versado" },
  reversteam: { baseRules: true },
};

function variantFor(settings: MapSettings): VariantConfig {
  if (settings.variantConfig == null) return {};
  const override = REQUIRED_VARIANTS[settings.key];
  if (override != null) return settings.variantConfig.parse(override);
  try {
    return settings.variantConfig.parse({}) as VariantConfig;
  } catch {
    throw new Error(
      `Map "${settings.key}" declares a variantConfig with required fields, but ` +
        `has no entry in REQUIRED_VARIANTS in this file. Add one so the map is ` +
        `covered rather than skipped.`,
    );
  }
}

const ALL_MAPS = [...MapRegistry.singleton.values()].sort((a, b) =>
  a.key < b.key ? -1 : 1,
);

describe("every registered map", () => {
  it("registers a plausible number of maps", () => {
    expect(ALL_MAPS.length).toBeGreaterThan(20);
  });

  for (const settings of ALL_MAPS) {
    describe(settings.key, () => {
      function start() {
        const players = Array.from(
          { length: settings.minPlayers },
          (_, index) => ({ playerId: index + 1 }),
        );
        const state = EngineDelegator.singleton.start({
          game: {
            id: 1,
            gameKey: settings.key,
            variant: variantFor(settings),
          },
          players,
          seed: `all-maps-${settings.key}`,
        });
        return {
          gameKey: settings.key,
          gameData: state.gameData,
          variant: variantFor(settings),
        };
      }

      it("starts and projects into a snapshot", () => {
        const snapshot = snapshotGame(start());

        expect(snapshot.round).toBe(1);
        expect(snapshot.players).toHaveLength(settings.minPlayers);
        expect(snapshot.phase).toBeDefined();
      });

      it("declares a non-trivial starting grid", () => {
        // Empty or placeholder grids are invalid. The smallest real map is
        // Jamaica at 34 spaces, so a floor of 10 leaves room for a genuinely
        // small map while still catching a stub.
        expect(settings.startingGrid.size).toBeGreaterThan(10);
      });

      it("has somewhere to deliver to", () => {
        const snapshot = snapshotGame(start());
        const destinations = snapshot.spaces.filter(
          (space) => space.kind === "city" || space.kind === "town",
        );

        // Deliberately counts cities OR towns: St Lucia is a towns-only map
        // with no cities at all, and Belgium has no towns.
        expect(destinations.length).toBeGreaterThanOrEqual(2);
      });

      it("satisfies the engine invariants at start", () => {
        expect(checkSnapshot(snapshotGame(start()))).toEqual([]);
      });

      it("renders without throwing", () => {
        expect(() => formatSnapshot(snapshotGame(start()))).not.toThrow();
      });

      it("projects deterministically", () => {
        expect(snapshotGame(start())).toEqual(snapshotGame(start()));
      });
    });
  }
});
