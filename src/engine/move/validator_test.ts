import "jasmine";

import { city, plain } from "../../testing/factory";
import { InjectionHelper } from "../../testing/injection_helper";
import { resettable } from "../../testing/resettable";
import { Coordinates } from "../../utils/coordinates";
import { GRID, INTER_CITY_CONNECTIONS } from "../game/state";
import { Good } from "../state/good";
import { PlayerColor, PlayerData } from "../state/player";
import { MutableSpaceData } from "../state/space";
import { Direction, SimpleTileType } from "../state/tile";
import { MoveData } from "./move";
import { MoveValidator } from "./validator";

describe("MoveValidator", () => {
  const injector = InjectionHelper.install();
  const validator = resettable(() => new MoveValidator());

  // Standard 3-city chain for most tests:
  //   cityA --[BLUE track]--> cityB --[RED track]--> cityC
  //
  // cityA: holds BLUE goods, accepts RED (not a BLUE delivery destination)
  // cityB: no goods, accepts RED (BLUE goods can transit through it)
  // cityC: no goods, accepts BLUE (valid BLUE delivery destination)
  const state = resettable(() => {
    const cityACoords = Coordinates.from({ q: 0, r: 0 });
    const land1Coords = cityACoords.neighbor(Direction.TOP);
    const cityBCoords = land1Coords.neighbor(Direction.TOP);
    const land2Coords = cityBCoords.neighbor(Direction.TOP);
    const cityCCoords = land2Coords.neighbor(Direction.TOP);

    const grid = new Map<Coordinates, MutableSpaceData>([
      [cityACoords, city({ goods: [Good.BLUE], color: Good.RED })],
      [land1Coords, plain({ tile: { tileType: SimpleTileType.STRAIGHT, orientation: Direction.TOP, owners: [PlayerColor.BLUE] } })],
      [cityBCoords, city({ goods: [], color: Good.RED })],
      [land2Coords, plain({ tile: { tileType: SimpleTileType.STRAIGHT, orientation: Direction.TOP, owners: [PlayerColor.RED] } })],
      [cityCCoords, city({ goods: [], color: Good.BLUE })],
    ]);
    injector.state().init(GRID, grid);
    injector.state().init(INTER_CITY_CONNECTIONS, []);

    const player: PlayerData = {
      playerId: 1,
      color: PlayerColor.BLUE,
      income: 0,
      shares: 0,
      money: 0,
      locomotive: 3,
    };

    return { cityACoords, land1Coords, cityBCoords, land2Coords, cityCCoords, player };
  });

  describe("validateEnd()", () => {
    it("throws when path is empty", () => {
      const action: MoveData = { startingCity: state().cityACoords, path: [], good: Good.BLUE };
      expect(() => validator().validateEnd(action)).toThrow();
    });

    it("throws when path ends at a non-city location", () => {
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [{ owner: PlayerColor.BLUE, endingStop: state().land1Coords }],
        good: Good.BLUE,
      };
      expect(() => validator().validateEnd(action)).toThrow();
    });

    it("accepts path ending at a city that accepts the good", () => {
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [{ owner: PlayerColor.BLUE, endingStop: state().cityCCoords }],
        good: Good.BLUE,
      };
      expect(() => validator().validateEnd(action)).not.toThrow();
    });

    it("throws when destination city does not accept the good", () => {
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [{ owner: PlayerColor.BLUE, endingStop: state().cityBCoords }],
        good: Good.BLUE,
      };
      expect(() => validator().validateEnd(action)).toThrow();
    });
  });

  describe("validatePartial()", () => {
    it("accepts a valid single-step path", () => {
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [{ owner: PlayerColor.BLUE, endingStop: state().cityBCoords }],
        good: Good.BLUE,
      };
      expect(() => validator().validatePartial(state().player, action)).not.toThrow();
    });

    it("accepts a valid two-step path through an intermediate city", () => {
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [
          { owner: PlayerColor.BLUE, endingStop: state().cityBCoords },
          { owner: PlayerColor.RED, endingStop: state().cityCCoords },
        ],
        good: Good.BLUE,
      };
      expect(() => validator().validatePartial(state().player, action)).not.toThrow();
    });

    it("throws when path length exceeds locomotive capacity", () => {
      const player: PlayerData = { ...state().player, locomotive: 0 };
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [{ owner: PlayerColor.BLUE, endingStop: state().cityBCoords }],
        good: Good.BLUE,
      };
      expect(() => validator().validatePartial(player, action)).toThrow();
    });

    it("throws when starting city does not hold the good", () => {
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [{ owner: PlayerColor.BLUE, endingStop: state().cityBCoords }],
        good: Good.RED,
      };
      expect(() => validator().validatePartial(state().player, action)).toThrow();
    });

    it("throws when the same coordinate is visited twice", () => {
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [
          { owner: PlayerColor.BLUE, endingStop: state().cityBCoords },
          { owner: PlayerColor.BLUE, endingStop: state().cityACoords },
        ],
        good: Good.BLUE,
      };
      expect(() => validator().validatePartial(state().player, action)).toThrow();
    });

    it("throws when the same logical city is visited twice via sameCity key", () => {
      const cityA2Coords = state().cityCCoords.neighbor(Direction.TOP);
      const SAME_CITY_KEY = 42;
      // cityCCoords becomes a track tile; cityA2Coords is added as the same logical city as cityA
      const sameCityGrid = new Map<Coordinates, MutableSpaceData>([
        [state().cityACoords, city({ goods: [Good.BLUE], color: Good.RED, sameCity: SAME_CITY_KEY })],
        [state().land1Coords, plain({ tile: { tileType: SimpleTileType.STRAIGHT, orientation: Direction.TOP, owners: [PlayerColor.BLUE] } })],
        [state().cityBCoords, city({ goods: [], color: Good.RED })],
        [state().land2Coords, plain({ tile: { tileType: SimpleTileType.STRAIGHT, orientation: Direction.TOP, owners: [PlayerColor.RED] } })],
        [state().cityCCoords, plain({ tile: { tileType: SimpleTileType.STRAIGHT, orientation: Direction.TOP, owners: [PlayerColor.RED] } })],
        [cityA2Coords, city({ goods: [], color: Good.RED, sameCity: SAME_CITY_KEY })],
      ]);
      injector.state().set(GRID, sameCityGrid);

      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [
          { owner: PlayerColor.BLUE, endingStop: state().cityBCoords },
          { owner: PlayerColor.RED, endingStop: cityA2Coords },
        ],
        good: Good.BLUE,
      };
      expect(() => validator().validatePartial(state().player, action)).toThrow();
    });

    it("throws when an intermediate stop is plain land (not a city or town)", () => {
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [
          { owner: PlayerColor.BLUE, endingStop: state().land1Coords },
          { owner: PlayerColor.BLUE, endingStop: state().cityBCoords },
        ],
        good: Good.BLUE,
      };
      expect(() => validator().validatePartial(state().player, action)).toThrow();
    });

    it("throws when good cannot transit through an intermediate city that accepts it", () => {
      // Replace cityB with a city that accepts BLUE, blocking transit
      const blockedGrid = new Map<Coordinates, MutableSpaceData>([
        [state().cityACoords, city({ goods: [Good.BLUE], color: Good.RED })],
        [state().land1Coords, plain({ tile: { tileType: SimpleTileType.STRAIGHT, orientation: Direction.TOP, owners: [PlayerColor.BLUE] } })],
        [state().cityBCoords, city({ goods: [], color: Good.BLUE })],
        [state().land2Coords, plain({ tile: { tileType: SimpleTileType.STRAIGHT, orientation: Direction.TOP, owners: [PlayerColor.RED] } })],
        [state().cityCCoords, city({ goods: [], color: Good.RED })],
      ]);
      injector.state().set(GRID, blockedGrid);

      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [
          { owner: PlayerColor.BLUE, endingStop: state().cityBCoords },
          { owner: PlayerColor.RED, endingStop: state().cityCCoords },
        ],
        good: Good.BLUE,
      };
      expect(() => validator().validatePartial(state().player, action)).toThrow();
    });

    it("throws when no route exists between consecutive stops", () => {
      const noRouteGrid = new Map<Coordinates, MutableSpaceData>([
        [state().cityACoords, city({ goods: [Good.BLUE], color: Good.RED })],
        [state().land1Coords, plain()],
        [state().cityBCoords, city({ goods: [], color: Good.RED })],
      ]);
      injector.state().set(GRID, noRouteGrid);

      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [{ owner: PlayerColor.BLUE, endingStop: state().cityBCoords }],
        good: Good.BLUE,
      };
      expect(() => validator().validatePartial(state().player, action)).toThrow();
    });

    it("throws when the route is owned by a different player than specified", () => {
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [{ owner: PlayerColor.GREEN, endingStop: state().cityBCoords }],
        good: Good.BLUE,
      };
      expect(() => validator().validatePartial(state().player, action)).toThrow();
    });
  });

  describe("validatePartialForSearch()", () => {
    it("accepts the same valid paths as validatePartial", () => {
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [{ owner: PlayerColor.BLUE, endingStop: state().cityBCoords }],
        good: Good.BLUE,
      };
      expect(() => validator().validatePartialForSearch(state().player, action)).not.toThrow();
    });

    it("enforces locomotive limits", () => {
      const player: PlayerData = { ...state().player, locomotive: 0 };
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [{ owner: PlayerColor.BLUE, endingStop: state().cityBCoords }],
        good: Good.BLUE,
      };
      expect(() => validator().validatePartialForSearch(player, action)).toThrow();
    });

    it("enforces goods presence at starting city", () => {
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [{ owner: PlayerColor.BLUE, endingStop: state().cityBCoords }],
        good: Good.RED,
      };
      expect(() => validator().validatePartialForSearch(state().player, action)).toThrow();
    });

    it("enforces duplicate-stop detection", () => {
      const action: MoveData = {
        startingCity: state().cityACoords,
        path: [
          { owner: PlayerColor.BLUE, endingStop: state().cityBCoords },
          { owner: PlayerColor.BLUE, endingStop: state().cityACoords },
        ],
        good: Good.BLUE,
      };
      expect(() => validator().validatePartialForSearch(state().player, action)).toThrow();
    });

    it("does not validate route ownership (key optimization invariant)", () => {
      // The searcher builds paths exclusively from known-valid routes, so
      // re-validating ownership per step would be redundant O(n²) work.
      // validatePartialForSearch deliberately skips this check.
      const wrongOwnerAction: MoveData = {
        startingCity: state().cityACoords,
        path: [{ owner: PlayerColor.GREEN, endingStop: state().cityBCoords }],
        good: Good.BLUE,
      };
      expect(() => validator().validatePartial(state().player, wrongOwnerAction)).toThrow();
      expect(() => validator().validatePartialForSearch(state().player, wrongOwnerAction)).not.toThrow();
    });
  });

  describe("findRoutesFromLocation()", () => {
    it("returns routes from a city with connected track", () => {
      const routes = validator().findRoutesFromLocation(state().cityACoords);
      expect(routes.length).toBe(1);
      expect(routes[0].destination).toBe(state().cityBCoords);
      expect(routes[0].owner).toBe(PlayerColor.BLUE);
    });

    it("returns routes in both directions from a land tile with track", () => {
      const routes = validator().findRoutesFromLocation(state().land1Coords);
      expect(routes.length).toBe(2);
      const destinations = routes.map((r) => r.destination);
      expect(destinations).toContain(state().cityACoords);
      expect(destinations).toContain(state().cityBCoords);
    });

    it("returns empty from a city with no connected track", () => {
      const isolatedGrid = new Map<Coordinates, MutableSpaceData>([
        [state().cityACoords, city({ goods: [Good.BLUE] })],
      ]);
      injector.state().set(GRID, isolatedGrid);

      const routes = validator().findRoutesFromLocation(state().cityACoords);
      expect(routes.length).toBe(0);
    });
  });

  describe("findRoutesToLocation()", () => {
    it("returns matching route when a direct connection exists", () => {
      const routes = validator().findRoutesToLocation(
        state().player,
        state().cityACoords,
        state().cityBCoords,
      );
      expect(routes.length).toBe(1);
      expect(routes[0].destination).toBe(state().cityBCoords);
      expect(routes[0].owner).toBe(PlayerColor.BLUE);
    });

    it("returns empty when no direct connection to the target city exists", () => {
      // cityC is two hops from cityA — no direct single-track connection
      const routes = validator().findRoutesToLocation(
        state().player,
        state().cityACoords,
        state().cityCCoords,
      );
      expect(routes.length).toBe(0);
    });
  });
});
