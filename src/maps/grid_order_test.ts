import { isOrdered } from "immutable";
import { Grid } from "../engine/map/grid";
import { MapRegistry } from "../maps/registry";
import { Coordinates } from "../utils/coordinates";

/**
 * Grids must iterate in a defined order.
 *
 * GameStarter.drawCubesForCities walks a map's starting grid and pops from the
 * shuffled bag as it goes, so the iteration order decides which city gets which
 * cube. Chicago L likewise picks the government's starting city by indexing into
 * Grid.cities().
 *
 * Both used to be plain Immutable Maps, whose iteration order Immutable
 * documents as undefined: they are hash tries, and the hash of an object key is
 * a process-local counter assigned on first use. Coordinates are interned and
 * shared between maps, so whichever map's grid was built first claimed the low
 * hashes and every other map's order followed from that. The board a given seed
 * dealt therefore depended on module load order, and shifted whenever the set of
 * registered maps changed -- which is why a game recorded months ago cannot be
 * reproduced from its seed today.
 *
 * These are the checks that would have caught it. An earlier attempt at proving
 * setup was seed-determined could not: every case shared one process, and so one
 * load order.
 */
describe("grid iteration order", () => {
  const ALL_MAPS = [...MapRegistry.singleton.values()].sort((a, b) =>
    a.key < b.key ? -1 : 1,
  );

  it("covers every registered map", () => {
    expect(ALL_MAPS.length).toBeGreaterThan(20);
  });

  for (const settings of ALL_MAPS) {
    describe(settings.key, () => {
      it("has a starting grid with a defined iteration order", () => {
        // False for a plain Immutable Map, true for an OrderedMap. Asserted
        // directly rather than by observing an order, so switching the type back
        // fails here rather than somewhere subtle downstream.
        expect(isOrdered(settings.startingGrid)).toBe(true);
      });

      it("iterates its starting grid in the order the map declares it", () => {
        // factory.ts inserts by looping over the grid literal, column then row,
        // so insertion order -- and therefore iteration order -- is the source
        // layout. A hash-ordered map would not match this.
        const keys = [...settings.startingGrid.keys()];
        const expected = [...keys].sort((a, b) =>
          a.q !== b.q ? a.q - b.q : a.r - b.r,
        );

        expect(keys.map(describe_)).toEqual(expected.map(describe_));
      });

      it("builds a runtime grid with a defined iteration order", () => {
        const grid = Grid.fromData(
          settings,
          settings.startingGrid,
          settings.interCityConnections ?? [],
        );

        // Chicago L indexes into cities() with the seeded generator, so this
        // order has to be defined too, not just the starting grid's.
        expect([...grid.keys()].map(describe_)).toEqual(
          [...settings.startingGrid.keys()].map(describe_),
        );
      });

      it("orders cities consistently with the grid", () => {
        const grid = Grid.fromData(
          settings,
          settings.startingGrid,
          settings.interCityConnections ?? [],
        );
        const cityOrder = grid
          .cities()
          .map((city) => describe_(city.coordinates));
        const gridOrder = [...grid.keys()]
          .filter((coordinates) => cityOrder.includes(describe_(coordinates)))
          .map(describe_);

        expect(cityOrder).toEqual(gridOrder);
      });
    });
  }
});

function describe_(coordinates: Coordinates): string {
  return coordinates.serialize();
}
