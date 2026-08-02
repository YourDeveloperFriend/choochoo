import { describe, expect, it } from "vitest";
import { InjectionHelper } from '../../testing/injection_helper';
import { Coordinates } from '../../utils/coordinates';
import { GRID, INTER_CITY_CONNECTIONS } from '../game/state';
import { isTownTile } from '../map/tile';
import { SpaceType } from '../state/location_type';
import { LandData, SpaceData } from '../state/space';
import { ComplexTileType, Direction, SimpleTileType, TileType, TownTileType } from '../state/tile';
import { BuildCostCalculator } from "./cost";

const { RIVER, MOUNTAIN, PLAIN, SWAMP, LAKE, STREET } = SpaceType;
const {
  LOLLYPOP,
  THREE_WAY,
  LEFT_LEANER,
  RIGHT_LEANER,
  TIGHT_THREE,
  CHICKEN_FOOT,
  K,
} = TownTileType;

const {
  // CROSSING
  BOW_AND_ARROW,
  CROSSING_CURVES,

  // COEXISTING
  STRAIGHT_TIGHT,
  COEXISTING_CURVES,
  CURVE_TIGHT_1,
  CURVE_TIGHT_2,
} = ComplexTileType;


describe(BuildCostCalculator.name, () => {
  const injector = InjectionHelper.install();

  interface CalculateCostProps {
    from?: TileType,
    to: TileType,
    type?: LandData['type'],
    fromOrientation?: Direction;
    toOrientation?: Direction;
  }

  injector.initResettableState(GRID, new Map());
  injector.initResettableState(INTER_CITY_CONNECTIONS, []);

  function calculateCost({ from, to, type, fromOrientation, toOrientation }: CalculateCostProps) {
    const coordinates = Coordinates.from({ q: 0, r: 0 });
    const grid = new Map<Coordinates, SpaceData>([
      [coordinates, {
        type: type ?? PLAIN,
        townName: isTownTile(to) ? 'Foo Town' : undefined,
        tile: from && {
          tileType: from,
          orientation: fromOrientation ?? Direction.TOP,
          owners: [undefined],
        },
      }],
    ]);
    injector.state().set(GRID, grid);

    const calculator = new BuildCostCalculator();
    return calculator.costOf(coordinates, to, toOrientation ?? Direction.TOP);
  }

  it('calculates simple track', () => {
    expect(calculateCost({ type: PLAIN, to: SimpleTileType.STRAIGHT })).toBe(2);
    expect(calculateCost({ type: PLAIN, to: SimpleTileType.CURVE })).toBe(2);
    expect(calculateCost({ type: PLAIN, to: SimpleTileType.TIGHT })).toBe(2);

    expect(calculateCost({ type: RIVER, to: SimpleTileType.STRAIGHT })).toBe(3);
    expect(calculateCost({ type: RIVER, to: SimpleTileType.CURVE })).toBe(3);
    expect(calculateCost({ type: RIVER, to: SimpleTileType.TIGHT })).toBe(3);

    expect(calculateCost({ type: MOUNTAIN, to: SimpleTileType.STRAIGHT })).toBe(4);
    expect(calculateCost({ type: MOUNTAIN, to: SimpleTileType.CURVE })).toBe(4);
    expect(calculateCost({ type: MOUNTAIN, to: SimpleTileType.TIGHT })).toBe(4);

    expect(calculateCost({ type: SWAMP, to: SimpleTileType.STRAIGHT })).toBe(4);
    expect(calculateCost({ type: SWAMP, to: SimpleTileType.CURVE })).toBe(4);
    expect(calculateCost({ type: SWAMP, to: SimpleTileType.TIGHT })).toBe(4);

    expect(calculateCost({ type: LAKE, to: SimpleTileType.STRAIGHT })).toBe(6);
    expect(calculateCost({ type: LAKE, to: SimpleTileType.CURVE })).toBe(6);
    expect(calculateCost({ type: LAKE, to: SimpleTileType.TIGHT })).toBe(6);

    expect(calculateCost({ type: STREET, to: SimpleTileType.STRAIGHT })).toBe(4);
    expect(calculateCost({ type: STREET, to: SimpleTileType.CURVE })).toBe(4);
    expect(calculateCost({ type: STREET, to: SimpleTileType.TIGHT })).toBe(4);
  });

  it('calculates towns', () => {
    expect(calculateCost({ to: LOLLYPOP })).toBe(2);
    expect(calculateCost({ to: TownTileType.STRAIGHT })).toBe(3);
    expect(calculateCost({ to: TownTileType.CURVE })).toBe(3);
    expect(calculateCost({ to: TownTileType.TIGHT })).toBe(3);
    expect(calculateCost({ to: THREE_WAY })).toBe(4);
    expect(calculateCost({ to: LEFT_LEANER })).toBe(4);
    expect(calculateCost({ to: RIGHT_LEANER })).toBe(4);
    expect(calculateCost({ to: TIGHT_THREE })).toBe(4);
    expect(calculateCost({ to: TownTileType.X })).toBe(5);
    expect(calculateCost({ to: CHICKEN_FOOT })).toBe(5);
    expect(calculateCost({ to: K })).toBe(5);
  });

  it('calculates complex track built from scratch on a plain', () => {
    expect(calculateCost({ to: ComplexTileType.X, type: PLAIN })).toBe(4);
    expect(calculateCost({ to: BOW_AND_ARROW, type: PLAIN })).toBe(4);
    expect(calculateCost({ to: CROSSING_CURVES, type: PLAIN })).toBe(4);

    expect(calculateCost({ to: STRAIGHT_TIGHT, type: PLAIN })).toBe(3);
    expect(calculateCost({ to: COEXISTING_CURVES, type: PLAIN })).toBe(3);
    expect(calculateCost({ to: CURVE_TIGHT_1, type: PLAIN })).toBe(3);
    expect(calculateCost({ to: CURVE_TIGHT_2, type: PLAIN })).toBe(3);
  });

  it('calculates complex track built from scratch on a river', () => {
    expect(calculateCost({ to: ComplexTileType.X, type: RIVER })).toBe(5);
    expect(calculateCost({ to: BOW_AND_ARROW, type: RIVER })).toBe(5);
    expect(calculateCost({ to: CROSSING_CURVES, type: RIVER })).toBe(5);

    expect(calculateCost({ to: STRAIGHT_TIGHT, type: RIVER })).toBe(4);
    expect(calculateCost({ to: COEXISTING_CURVES, type: RIVER })).toBe(4);
    expect(calculateCost({ to: CURVE_TIGHT_1, type: RIVER })).toBe(4);
    expect(calculateCost({ to: CURVE_TIGHT_2, type: RIVER })).toBe(4);
  });

  it('calculates complex track built from scratch on a mountain', () => {
    expect(calculateCost({ to: ComplexTileType.X, type: MOUNTAIN })).toBe(6);
    expect(calculateCost({ to: BOW_AND_ARROW, type: MOUNTAIN })).toBe(6);
    expect(calculateCost({ to: CROSSING_CURVES, type: MOUNTAIN })).toBe(6);

    expect(calculateCost({ to: STRAIGHT_TIGHT, type: MOUNTAIN })).toBe(5);
    expect(calculateCost({ to: COEXISTING_CURVES, type: MOUNTAIN })).toBe(5);
    expect(calculateCost({ to: CURVE_TIGHT_1, type: MOUNTAIN })).toBe(5);
    expect(calculateCost({ to: CURVE_TIGHT_2, type: MOUNTAIN })).toBe(5);
  });

  it('upgrading a town always costs 3', () => {
    // Just choose a random collection, rather than every iteration.
    expect(calculateCost({ from: LOLLYPOP, to: TownTileType.STRAIGHT })).toBe(3);
    expect(calculateCost({ from: TownTileType.STRAIGHT, to: TownTileType.X })).toBe(3);
    expect(calculateCost({ from: TownTileType.LEFT_LEANER, to: TownTileType.K })).toBe(3);
  });

  it('rerouting a simple tile costs 2', () => {
    expect(calculateCost({ from: SimpleTileType.STRAIGHT, to: SimpleTileType.CURVE })).toBe(2);
    expect(calculateCost({ from: SimpleTileType.CURVE, to: SimpleTileType.TIGHT })).toBe(2);
    expect(calculateCost({ from: SimpleTileType.TIGHT, to: SimpleTileType.STRAIGHT })).toBe(2);
  });

  it('rerouting a complex tile costs 2', () => {
    expect(calculateCost({ from: ComplexTileType.X, fromOrientation: Direction.TOP_LEFT, to: STRAIGHT_TIGHT })).toBe(2);
    expect(calculateCost({ from: CURVE_TIGHT_1, to: COEXISTING_CURVES })).toBe(2);
  });

  it('rerouting two tracks costs $4', () => {
    expect(calculateCost({ from: CROSSING_CURVES, to: ComplexTileType.X })).toBe(4);
  });

  it('upgrading to a complex coexisting costs 2', () => {
    expect(calculateCost({ from: SimpleTileType.CURVE, to: COEXISTING_CURVES })).toBe(2);
    expect(calculateCost({ from: SimpleTileType.TIGHT, to: STRAIGHT_TIGHT })).toBe(2);
    expect(calculateCost({ from: SimpleTileType.TIGHT, to: CURVE_TIGHT_1 })).toBe(2);
    expect(calculateCost({ from: SimpleTileType.TIGHT, to: CURVE_TIGHT_2 })).toBe(2);
  });

  it('upgrading to a complex crossing costs 3', () => {
    expect(calculateCost({ from: SimpleTileType.CURVE, to: CROSSING_CURVES })).toBe(3);
    expect(calculateCost({ from: SimpleTileType.STRAIGHT, to: ComplexTileType.X })).toBe(3);
    expect(calculateCost({ from: SimpleTileType.STRAIGHT, to: BOW_AND_ARROW })).toBe(3);
  });
});