import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BuildData } from "../../engine/build/build";
import { BuildDiscountManager } from "../../engine/build/discount";
import { BUILD_STATE } from "../../engine/build/state";
import { setInjectionContext } from "../../engine/framework/execution_context";
import { InjectionContext } from "../../engine/framework/inject";
import { GameMemory } from "../../engine/game/game_memory";
import { StateStore } from "../../engine/framework/state";
import {
  CURRENT_PLAYER,
  GRID,
  injectAllPlayersUnsafe,
  INTER_CITY_CONNECTIONS,
} from "../../engine/game/state";
import { Action } from "../../engine/state/action";
import { SpaceType } from "../../engine/state/location_type";
import { PlayerColor } from "../../engine/state/player";
import { LandData } from "../../engine/state/space";
import { Direction, SimpleTileType } from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";
import { COASTAL_ENGINEER, NATIONAL_PARKWAY_ENGINEER } from "./actions";
import { MauiDiscountManager } from "./build";
import { MauiMapSettings } from "./settings";

const BEACH_ORIGIN = Coordinates.from({ q: 0, r: 0 });
const MOUNTAIN_ORIGIN = Coordinates.from({ q: 0, r: 1 });
const PLAIN_ORIGIN = Coordinates.from({ q: 0, r: 2 });
const BUILT_BEACH = Coordinates.from({ q: 0, r: 3 });

const BEACH: LandData = { type: SpaceType.DESERT };

function buildAt(coordinates: Coordinates): BuildData {
  return {
    coordinates,
    tileType: SimpleTileType.STRAIGHT,
    orientation: Direction.TOP,
  };
}

describe(MauiDiscountManager.name, () => {
  let context: InjectionContext;
  let manager: BuildDiscountManager;

  /** Starts a build turn for a player who selected `action`, with `buildCount` builds already made. */
  function startTurn(action: Action | undefined, buildCount = 0) {
    const state = context.get(StateStore);
    injectAllPlayersUnsafe().upsert([
      {
        playerId: 1,
        color: PlayerColor.RED,
        income: 0,
        shares: 2,
        money: 16,
        locomotive: 1,
        selectedAction: action,
      },
    ]);
    state.upsert(CURRENT_PLAYER, PlayerColor.RED);
    state.upsert(BUILD_STATE, {
      previousBuilds: [],
      buildCount,
      hasUrbanized: false,
      danglers: [],
    });
  }

  function setBuildCount(buildCount: number) {
    context.get(StateStore).set(BUILD_STATE, {
      previousBuilds: [],
      buildCount,
      hasUrbanized: false,
      danglers: [],
    });
  }

  /** Applies the discount the way BuildAction does: ask for it, then record it. */
  function build(coordinates: Coordinates, cost: number): number {
    const discount = manager.getDiscount(buildAt(coordinates), cost);
    manager.applyDiscount(buildAt(coordinates), cost);
    return discount;
  }

  beforeEach(() => {
    context = new InjectionContext(new MauiMapSettings().key);
    setInjectionContext(context);
    vi.spyOn(context.get(GameMemory), "getGame").mockReturnValue({
      id: 1,
      gameKey: new MauiMapSettings().key,
      variant: {},
    });
    const state = context.get(StateStore);
    state.init(
      GRID,
      new Map([
        [BEACH_ORIGIN, BEACH],
        [MOUNTAIN_ORIGIN, { type: SpaceType.MOUNTAIN }],
        [PLAIN_ORIGIN, { type: SpaceType.PLAIN }],
        [
          BUILT_BEACH,
          {
            ...BEACH,
            tile: {
              tileType: SimpleTileType.STRAIGHT,
              orientation: Direction.TOP,
              owners: [undefined],
            },
          },
        ],
      ]),
    );
    state.init(INTER_CITY_CONNECTIONS, []);
    manager = context.get(BuildDiscountManager);
  });

  afterEach(() => {
    setInjectionContext();
  });

  it("is the Maui override", () => {
    expect(manager).toBeInstanceOf(MauiDiscountManager);
  });

  describe("without an engineer", () => {
    it("never discounts", () => {
      startTurn(Action.FIRST_BUILD);
      expect(build(BEACH_ORIGIN, 13)).toBe(0);
      expect(build(MOUNTAIN_ORIGIN, 6)).toBe(0);
    });
  });

  describe("Coastal Engineer", () => {
    it("reduces beaches to $3", () => {
      startTurn(COASTAL_ENGINEER);
      expect(build(BEACH_ORIGIN, 13)).toBe(10);
    });

    it("does not discount other terrain or already built beaches", () => {
      startTurn(COASTAL_ENGINEER);
      expect(build(PLAIN_ORIGIN, 4)).toBe(0);
      expect(build(MOUNTAIN_ORIGIN, 6)).toBe(0);
      expect(build(BUILT_BEACH, 2)).toBe(0);
    });

    it("never discounts more than the cost", () => {
      startTurn(COASTAL_ENGINEER);
      expect(manager.getDiscount(buildAt(BEACH_ORIGIN), 8)).toBe(8);
    });

    it("charges back every beach discount on the fourth build", () => {
      startTurn(COASTAL_ENGINEER);
      expect(build(BEACH_ORIGIN, 13)).toBe(10);
      setBuildCount(1);
      expect(build(BEACH_ORIGIN, 13)).toBe(10);
      setBuildCount(2);
      expect(build(PLAIN_ORIGIN, 4)).toBe(0);
      setBuildCount(3);

      // A negative discount makes the fourth build cost $20 extra.
      expect(manager.getDiscount(buildAt(PLAIN_ORIGIN), 4)).toBe(-20);
    });

    it("charges nothing back when no beach discount was received", () => {
      startTurn(COASTAL_ENGINEER);
      expect(build(PLAIN_ORIGIN, 4)).toBe(0);
      setBuildCount(3);
      expect(manager.getDiscount(buildAt(PLAIN_ORIGIN), 4)).toBe(0);
    });

    it("does not record a discount for the fourth build", () => {
      startTurn(COASTAL_ENGINEER, 3);
      expect(build(BEACH_ORIGIN, 13)).toBe(0);
      manager.onBuildRoundEnd();
      setBuildCount(3);
      expect(manager.getDiscount(buildAt(PLAIN_ORIGIN), 4)).toBe(0);
    });

    it("forgets the discounts at the end of the build turn", () => {
      startTurn(COASTAL_ENGINEER);
      build(BEACH_ORIGIN, 13);
      manager.onBuildRoundEnd();

      startTurn(COASTAL_ENGINEER, 3);
      expect(manager.getDiscount(buildAt(PLAIN_ORIGIN), 4)).toBe(0);
    });
  });

  describe("National Parkway Engineer", () => {
    it("reduces mountains to $4", () => {
      startTurn(NATIONAL_PARKWAY_ENGINEER);
      expect(build(MOUNTAIN_ORIGIN, 6)).toBe(2);
    });

    it("does not discount other terrain", () => {
      startTurn(NATIONAL_PARKWAY_ENGINEER);
      expect(build(BEACH_ORIGIN, 13)).toBe(0);
      expect(build(PLAIN_ORIGIN, 4)).toBe(0);
    });

    it("keeps discounting on the fourth build", () => {
      startTurn(NATIONAL_PARKWAY_ENGINEER, 3);
      expect(build(MOUNTAIN_ORIGIN, 6)).toBe(2);
    });
  });
});
