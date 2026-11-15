import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BuildCostCalculator } from "../../engine/build/cost";
import { setInjectionContext } from "../../engine/framework/execution_context";
import { InjectionContext } from "../../engine/framework/inject";
import { StateStore } from "../../engine/framework/state";
import { GameMemory } from "../../engine/game/game_memory";
import { PlayerHelper } from "../../engine/game/player";
import {
  CURRENT_PLAYER,
  GRID,
  injectAllPlayersUnsafe,
  INTER_CITY_CONNECTIONS,
  TURN_ORDER,
} from "../../engine/game/state";
import { MoveValidator } from "../../engine/move/validator";
import { allGoods, Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { PlayerColor } from "../../engine/state/player";
import { SpaceData } from "../../engine/state/space";
import { Direction, TownTileType } from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";
import { city } from "../factory";
import { map, MOSCOW } from "./grid";
import { StalinistRussiaMapSettings } from "./settings";
import { DISFAVOR_TRACK, LOCO_TRACK } from "./state";
import { LocoRow } from "./track_data";

const { RED, BLUE } = PlayerColor;
const ORIGIN = Coordinates.from({ q: 0, r: 0 });
const MOSCOW_LOCATION = Coordinates.from({ q: 2, r: 0 });
const DESTINATION = Coordinates.from({ q: 4, r: 0 });

function player(color: PlayerColor, income = 0) {
  return {
    playerId: color,
    color,
    income,
    shares: 0,
    money: 20,
    locomotive: 1,
  };
}

describe("Stalinist Russia gameplay rules", () => {
  let context: InjectionContext;
  let state: StateStore;

  beforeEach(() => {
    const gameKey = new StalinistRussiaMapSettings().key;
    context = new InjectionContext(gameKey);
    setInjectionContext(context);
    vi.spyOn(context.get(GameMemory), "getGame").mockReturnValue({
      id: 1,
      gameKey,
      variant: {},
    });
    state = context.get(StateStore);
    state.init(GRID, new Map());
    state.init(INTER_CITY_CONNECTIONS, []);
    state.init(CURRENT_PLAYER, RED);
    state.init(TURN_ORDER, [RED, BLUE]);
    injectAllPlayersUnsafe().initState([player(BLUE, 1), player(RED)]);
    state.init(
      DISFAVOR_TRACK,
      new Map([
        [RED, 0],
        [BLUE, 1],
      ]),
    );
    state.init(LOCO_TRACK, new Map([[RED, { box: 1, row: LocoRow.SINGLE }]]));
  });

  afterEach(() => {
    setInjectionContext();
    vi.restoreAllMocks();
  });

  describe("Moscow deliveries", () => {
    // Use owned connections to isolate delivery validation from track geometry.
    function setupRoute(good: Good, moscowGoods: Good[]) {
      state.set(
        GRID,
        new Map<Coordinates, SpaceData>([
          [ORIGIN, { ...city("Origin", []), goods: [good] }],
          [MOSCOW_LOCATION, { ...city(MOSCOW, []), goods: moscowGoods }],
          [DESTINATION, city("Destination", good)],
        ]),
      );
      state.set(INTER_CITY_CONNECTIONS, [
        {
          id: "into-moscow",
          connects: [ORIGIN, MOSCOW_LOCATION],
          cost: 0,
          owner: { color: RED },
        },
        {
          id: "out-of-moscow",
          connects: [MOSCOW_LOCATION, DESTINATION],
          cost: 0,
          owner: { color: RED },
        },
      ]);
    }

    it.each([...allGoods])(
      "allows color %s through Moscow only when that color is present",
      (good) => {
        const validator = context.get(MoveValidator);
        const action = {
          startingCity: ORIGIN,
          good,
          path: [
            { endingStop: MOSCOW_LOCATION, owner: RED },
            { endingStop: DESTINATION, owner: RED },
          ],
        };
        setupRoute(good, [good]);
        expect(() => validator.validate(player(RED), action)).not.toThrow();
        setupRoute(
          good,
          [...allGoods].filter((other) => other !== good),
        );
        expect(() => validator.validate(player(RED), action)).toThrow(
          "Cannot pass through",
        );
      },
    );

    it.each([...allGoods])(
      "accepts color %s into Moscow only when that color is absent",
      (good) => {
        const validator = context.get(MoveValidator);
        const action = {
          startingCity: ORIGIN,
          good,
          path: [{ endingStop: MOSCOW_LOCATION, owner: RED }],
        };
        setupRoute(
          good,
          [...allGoods].filter((other) => other !== good),
        );
        expect(() => validator.validate(player(RED), action)).not.toThrow();
        setupRoute(good, [good]);
        expect(() => validator.validate(player(RED), action)).toThrow(
          "cannot be delivered",
        );
      },
    );
  });

  describe("final scoring", () => {
    it("breaks equal final scores in favor of fewer disfavor advances", () => {
      // Blue's extra income offsets its -3 disfavor penalty: both finish at 0 VP.
      const helper = context.get(PlayerHelper);
      expect(helper.getScore(player(RED))[0]).toBe(0);
      expect(helper.getScore(player(BLUE, 1))[0]).toBe(0);
      expect(
        helper
          .getPlayersOrderedByScore()
          .map((group) => group.map((p) => p.color)),
      ).toEqual([[RED], [BLUE]]);
    });

    it("shares a placement when final score and disfavor position are equal", () => {
      state.set(
        DISFAVOR_TRACK,
        new Map([
          [RED, 1],
          [BLUE, 1],
        ]),
      );
      injectAllPlayersUnsafe().set([player(BLUE, 1), player(RED, 1)]);
      const placements = context.get(PlayerHelper).getPlayersOrderedByScore();
      expect(placements).toHaveLength(1);
      expect(placements[0].map((p) => p.color).sort()).toEqual(
        [RED, BLUE].sort(),
      );
    });

    it("ranks final victory points ahead of the disfavor tiebreaker", () => {
      injectAllPlayersUnsafe().set([player(BLUE, 2), player(RED)]);
      expect(
        context
          .get(PlayerHelper)
          .getPlayersOrderedByScore()
          .map((group) => group.map((p) => p.color)),
      ).toEqual([[BLUE], [RED]]);
    });
  });

  describe("town construction costs", () => {
    const towns = [...map.entries()].filter(
      ([, space]) => "townName" in space && space.townName != null,
    );
    const replacements = [
      [TownTileType.LOLLYPOP, TownTileType.STRAIGHT],
      [TownTileType.STRAIGHT, TownTileType.THREE_WAY],
      [TownTileType.THREE_WAY, TownTileType.X],
    ];

    it.each(towns)(
      "charges a flat $3 replacement cost at %s, plus the last-player surcharge",
      (coordinates, space) => {
        const calculator = context.get(BuildCostCalculator);
        for (const [from, to] of replacements) {
          state.set(
            GRID,
            new Map([
              [
                coordinates,
                {
                  ...space,
                  tile: {
                    tileType: from,
                    orientation: Direction.TOP,
                    owners: [undefined],
                  },
                },
              ],
            ]),
          );
          state.set(CURRENT_PLAYER, RED);
          expect(calculator.costOf(coordinates, to, Direction.TOP)).toBe(3);
          state.set(CURRENT_PLAYER, BLUE);
          expect(calculator.costOf(coordinates, to, Direction.TOP)).toBe(4);
        }
      },
    );

    it.each(towns)(
      "applies river terrain only to initial construction at %s",
      (coordinates, space) => {
        state.set(GRID, new Map([[coordinates, space]]));
        const calculator = context.get(BuildCostCalculator);
        // A two-exit town costs $1 + $1 per exit, plus $1 for river terrain.
        const river = "townName" in space && space.type === SpaceType.RIVER;
        expect(
          calculator.costOf(coordinates, TownTileType.STRAIGHT, Direction.TOP),
        ).toBe(river ? 4 : 3);
      },
    );
  });
});
