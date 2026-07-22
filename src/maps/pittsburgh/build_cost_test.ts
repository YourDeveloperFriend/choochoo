import 'jasmine';
import { InjectionHelper } from '../../testing/injection_helper';
import { Coordinates } from '../../utils/coordinates';
import { GRID, INTER_CITY_CONNECTIONS } from '../../engine/game/state';
import { isTownTile } from '../../engine/map/tile';
import { SpaceType } from '../../engine/state/location_type';
import { LandData, SpaceData } from '../../engine/state/space';
import { BOTTOM_LEFT, ComplexTileType, Direction, SimpleTileType, TileType, TOP, TownTileType } from '../../engine/state/tile';
import { PittsburghFunkyBuilding } from "../../maps/pittsburgh/build_cost";
import { directionToRad, TOP_RIGHT } from '../../utils/point';

const { PLAIN } = SpaceType;
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


describe(PittsburghFunkyBuilding.name, () => {
  const injector = InjectionHelper.install();

  interface CalculateCostProps {
    from?: TileType;
    to: TileType;
    type?: LandData['type'];
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

    const calculator = new PittsburghFunkyBuilding();
    return calculator.costOf(coordinates, to, toOrientation ?? Direction.TOP);
  }

  describe('is first tile', () => {
    it('and is simple straight track (costs $10)', () => {
        expect(calculateCost({ to: SimpleTileType.STRAIGHT })).toBe(10);
    });

    it('and is simple non-straight track (costs $3)', () => {
        expect(calculateCost({ to: SimpleTileType.CURVE })).toBe(3);
        expect(calculateCost({ to: SimpleTileType.TIGHT })).toBe(3);
    });

    it('and is straight complex track (costs $10)', () => {
        expect(calculateCost({ to: BOW_AND_ARROW, type: PLAIN })).toBe(10);
        expect(calculateCost({ to: STRAIGHT_TIGHT, type: PLAIN })).toBe(10);
    });

    it('and is non-straight complex track (costs $4)', () => {
        expect(calculateCost({ to: CROSSING_CURVES, type: PLAIN })).toBe(4);    
        expect(calculateCost({ to: COEXISTING_CURVES, type: PLAIN })).toBe(4);
        expect(calculateCost({ to: CURVE_TIGHT_1, type: PLAIN })).toBe(4);
        expect(calculateCost({ to: CURVE_TIGHT_2, type: PLAIN })).toBe(4);
    });

    it('and is town (always costs $0)', () => {
        expect(calculateCost({ to: LOLLYPOP })).toBe(0);
        expect(calculateCost({ to: TownTileType.STRAIGHT })).toBe(0);
        expect(calculateCost({ to: TownTileType.CURVE })).toBe(0);
        expect(calculateCost({ to: TownTileType.TIGHT })).toBe(0);
        expect(calculateCost({ to: THREE_WAY })).toBe(0);
        expect(calculateCost({ to: LEFT_LEANER })).toBe(0);
        expect(calculateCost({ to: RIGHT_LEANER })).toBe(0);
        expect(calculateCost({ to: TIGHT_THREE })).toBe(0);
        expect(calculateCost({ to: CHICKEN_FOOT })).toBe(0);
        expect(calculateCost({ to: K })).toBe(0);
    });
  });

  it('upgrading a town always costs $0', () => {
    expect(calculateCost({ from: LOLLYPOP, to: TownTileType.STRAIGHT })).toBe(0);
    expect(calculateCost({ from: TownTileType.STRAIGHT, to: CHICKEN_FOOT })).toBe(0);
    expect(calculateCost({ from: TownTileType.LEFT_LEANER, to: TownTileType.K })).toBe(0);
  });

  describe('rerouting a simple tile', () => {
    it('to straight (costs $10)', () => {
        expect(calculateCost({ from: SimpleTileType.CURVE, to: SimpleTileType.STRAIGHT })).toBe(10);
        expect(calculateCost({ from: SimpleTileType.TIGHT, to: SimpleTileType.STRAIGHT })).toBe(10);
    });

    it('to non-straight (costs $3)', () => {
        expect(calculateCost({ from: SimpleTileType.STRAIGHT, to: SimpleTileType.CURVE })).toBe(3);
        expect(calculateCost({ from: SimpleTileType.STRAIGHT, to: SimpleTileType.TIGHT })).toBe(3);
        expect(calculateCost({ from: SimpleTileType.TIGHT, to: SimpleTileType.CURVE })).toBe(3);
        expect(calculateCost({ from: SimpleTileType.CURVE, to: SimpleTileType.TIGHT })).toBe(3);
    });
  });

  describe('simple->complex upgrade', () => {
    it('with !straight->!straight (costs $4)', () => {
        expect(calculateCost({ from: SimpleTileType.TIGHT, to: CURVE_TIGHT_1, toOrientation: Direction.TOP_RIGHT })).toBe(4);
        expect(calculateCost({ from: SimpleTileType.TIGHT, to: CURVE_TIGHT_2 })).toBe(4);
        expect(calculateCost({ from: SimpleTileType.CURVE, to: CROSSING_CURVES })).toBe(4);
        expect(calculateCost({ from: SimpleTileType.CURVE, to: COEXISTING_CURVES })).toBe(4);
    });

    it('with !straight->straight (costs $10)', () => {
        expect(calculateCost({ from: SimpleTileType.TIGHT, to: STRAIGHT_TIGHT, toOrientation: Direction.TOP_RIGHT })).toBe(10);
        expect(calculateCost({ from: SimpleTileType.TIGHT, to: BOW_AND_ARROW })).toBe(10);
        expect(calculateCost({ from: SimpleTileType.CURVE, to: BOW_AND_ARROW, toOrientation: Direction.BOTTOM_RIGHT })).toBe(10);
        expect(calculateCost({ from: SimpleTileType.CURVE, to: STRAIGHT_TIGHT })).toBe(10);
    });

    it('with straight->!straight (costs $4)', () => {
        expect(calculateCost({ from: SimpleTileType.STRAIGHT, to: COEXISTING_CURVES })).toBe(4);
        expect(calculateCost({ from: SimpleTileType.STRAIGHT, to: CURVE_TIGHT_1 })).toBe(4);
        expect(calculateCost({ from: SimpleTileType.STRAIGHT, to: CURVE_TIGHT_2 })).toBe(4);
        expect(calculateCost({ from: SimpleTileType.STRAIGHT, to: CROSSING_CURVES })).toBe(4);
    });

    it('with straight->straight calculation', () => {
        expect(calculateCost({ from: SimpleTileType.STRAIGHT, to: STRAIGHT_TIGHT })).toBe(4);
        expect(calculateCost({ from: SimpleTileType.STRAIGHT, to: STRAIGHT_TIGHT, toOrientation: Direction.TOP_LEFT })).toBe(10);
        expect(calculateCost({ from: SimpleTileType.STRAIGHT, to: BOW_AND_ARROW })).toBe(4);
        expect(calculateCost({ from: SimpleTileType.STRAIGHT, to: BOW_AND_ARROW, toOrientation: Direction.TOP_LEFT })).toBe(10);
    });
  });

  describe('complex->complex upgrade', () => {
    it('with !straight->!straight (costs $4)', () => {
        expect(calculateCost({ from: CURVE_TIGHT_2, to: COEXISTING_CURVES })).toBe(4);
        expect(calculateCost({ from: CURVE_TIGHT_2, to: CROSSING_CURVES })).toBe(4);
        expect(calculateCost({ from: CROSSING_CURVES, to: CURVE_TIGHT_1, toOrientation: Direction.BOTTOM })).toBe(4);
        expect(calculateCost({ from: COEXISTING_CURVES, to: CROSSING_CURVES, toOrientation: Direction.TOP_RIGHT })).toBe(4);
    });

    it('with !straight->straight (costs $10)', () => {
        expect(calculateCost({ from: CURVE_TIGHT_1, to: STRAIGHT_TIGHT })).toBe(10);
        expect(calculateCost({ from: CURVE_TIGHT_1, to: STRAIGHT_TIGHT, toOrientation: Direction.BOTTOM_LEFT })).toBe(10);
        expect(calculateCost({ from: CROSSING_CURVES, to: BOW_AND_ARROW, toOrientation: Direction.TOP_RIGHT })).toBe(10);
        expect(calculateCost({ from: CURVE_TIGHT_2, to: BOW_AND_ARROW, toOrientation: Direction.BOTTOM_LEFT })).toBe(10);
    });

    it('with straight->!straight (costs $4)', () => {
        expect(calculateCost({ from: STRAIGHT_TIGHT, to: CURVE_TIGHT_1 })).toBe(4);
        expect(calculateCost({ from: STRAIGHT_TIGHT, to: CROSSING_CURVES })).toBe(4);
        expect(calculateCost({ from: BOW_AND_ARROW, to: CROSSING_CURVES, toOrientation: Direction.TOP_LEFT })).toBe(4);
        expect(calculateCost({ from: BOW_AND_ARROW, to: COEXISTING_CURVES })).toBe(4);
    });

    it('with straight->straight calculation', () => {
        expect(calculateCost({ from: STRAIGHT_TIGHT, to: BOW_AND_ARROW })).toBe(4);
        expect(calculateCost({ from: STRAIGHT_TIGHT, to: BOW_AND_ARROW, toOrientation: Direction.TOP_RIGHT })).toBe(10);
        expect(calculateCost({ from: BOW_AND_ARROW, to: STRAIGHT_TIGHT })).toBe(4);
        expect(calculateCost({ from: BOW_AND_ARROW, to: BOW_AND_ARROW, toOrientation: Direction.TOP_RIGHT })).toBe(10);
    });
  });
});