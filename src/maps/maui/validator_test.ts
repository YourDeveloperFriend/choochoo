import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BUILD_STATE } from "../../engine/build/state";
import { Validator } from "../../engine/build/validator";
import { setInjectionContext } from "../../engine/framework/execution_context";
import { InjectionContext } from "../../engine/framework/inject";
import { Key } from "../../engine/framework/key";
import { StateStore } from "../../engine/framework/state";
import { GameMemory } from "../../engine/game/game_memory";
import { ROUND } from "../../engine/game/round";
import {
  CURRENT_PLAYER,
  GRID,
  injectAllPlayersUnsafe,
  INTER_CITY_CONNECTIONS,
} from "../../engine/game/state";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { PlayerColor } from "../../engine/state/player";
import { MutableSpaceData } from "../../engine/state/space";
import { Direction, SimpleTileType } from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";
import { MauiValidator } from "./build";
import { MauiMapSettings } from "./settings";

const CITY = Coordinates.from({ q: 0, r: 0 });
const NORTH = CITY.neighbor(Direction.TOP);
const SOUTH = CITY.neighbor(Direction.BOTTOM);

const plain = (): MutableSpaceData => ({ type: SpaceType.PLAIN });

describe(MauiValidator.name, () => {
  let context: InjectionContext;
  let validator: Validator;

  function setRound(round: number) {
    context.get(StateStore).upsert(ROUND, round);
  }

  /** The key the Maui build phase uses to remember cities linked this turn. */
  function cityBuilds() {
    return Key.fromString<Coordinates[]>("mauiCityBuilds");
  }

  function reasonToBuildStraightAt(coordinates: Coordinates) {
    return validator.getInvalidBuildReason(coordinates, {
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
      playerColor: PlayerColor.RED,
    });
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
      new Map<Coordinates, MutableSpaceData>([
        [
          CITY,
          {
            type: SpaceType.CITY,
            name: "Test City",
            color: [Good.RED],
            goods: [],
            onRoll: [],
          },
        ],
        [NORTH, plain()],
        [NORTH.neighbor(Direction.TOP), plain()],
        [SOUTH, plain()],
        [SOUTH.neighbor(Direction.BOTTOM), plain()],
      ]),
    );
    state.init(INTER_CITY_CONNECTIONS, []);
    injectAllPlayersUnsafe().initState([
      {
        playerId: 1,
        color: PlayerColor.RED,
        income: 0,
        shares: 2,
        money: 16,
        locomotive: 1,
      },
    ]);
    state.init(CURRENT_PLAYER, PlayerColor.RED);
    state.init(BUILD_STATE, {
      previousBuilds: [],
      buildCount: 0,
      hasUrbanized: false,
      danglers: [],
    });
    setRound(1);
    validator = context.get(Validator);
  });

  afterEach(() => {
    setInjectionContext();
  });

  it("allows building off a city when none was linked this turn", () => {
    expect(reasonToBuildStraightAt(NORTH)).toBeUndefined();
    expect(reasonToBuildStraightAt(SOUTH)).toBeUndefined();
  });

  it("rejects a second link into a city already linked this turn", () => {
    // A copy of the coordinates from the grid, exactly as the build action stores them.
    context.get(StateStore).init(cityBuilds(), [CITY]);

    expect(reasonToBuildStraightAt(SOUTH)).toBe(
      "can only build into or out of Test City once per turn",
    );
  });

  it("still matches after the state is serialized and reloaded", () => {
    context.get(StateStore).init(cityBuilds(), [CITY]);
    const serialized = context.get(StateStore).serialize();

    // A fresh store, as when a game is loaded from the database.
    const reloaded = new StateStore();
    reloaded.merge(serialized);

    // Reloading goes through JSON and then the key's zod parser, which must hand back the
    // same interned instance rather than an equal copy.
    expect(reloaded.get(cityBuilds())[0]).toBe(CITY);
  });

  it("only applies through turn 2", () => {
    context.get(StateStore).init(cityBuilds(), [CITY]);
    setRound(3);

    expect(reasonToBuildStraightAt(SOUTH)).toBeUndefined();
  });
});
