import { readFileSync } from "fs";
import { resolve } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BuildCostCalculator } from "../../engine/build/cost";
import { UrbanizeAction } from "../../engine/build/urbanize";
import { BUILD_STATE } from "../../engine/build/state";
import { Validator } from "../../engine/build/validator";
import { setInjectionContext } from "../../engine/framework/execution_context";
import { InjectionContext } from "../../engine/framework/inject";
import { StateStore } from "../../engine/framework/state";
import { GameMemory } from "../../engine/game/game_memory";
import { GameEngine } from "../../engine/game/game";
import { PHASE } from "../../engine/game/phase";
import { PlayerHelper } from "../../engine/game/player";
import { ROUND, RoundEngine } from "../../engine/game/round";
import { GameStarter } from "../../engine/game/starter";
import {
  AVAILABLE_CITIES,
  BAG,
  CURRENT_PLAYER,
  GRID,
  injectAllPlayersUnsafe,
  injectGrid,
} from "../../engine/game/state";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MoveInterceptor } from "../../engine/move/interceptor";
import { MoveSearcher } from "../../engine/move/searcher";
import { MoveValidator } from "../../engine/move/validator";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { allGoods, Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { PlayerColor, PlayerData } from "../../engine/state/player";
import { MutableSpaceData } from "../../engine/state/space";
import {
  ComplexTileType,
  Direction,
  SimpleTileType,
  TownTileType,
} from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";
import { city, town } from "../factory";
import { MapRegistry } from "../registry";
import { BLOCKED_ACTIONS } from "./actions";
import { ChangeDeliveryAction } from "./goods_growth";
import { map } from "./grid";
import {
  DELIVERY_SPACES,
  MANIFEST,
  MANIFEST_PENALTIES,
  NEW_CITY_SUPPLY,
} from "./state";
import { Fac51StateStore } from "./state_store";
import { Fac51UrbanizeAction } from "./urbanize";

const RED = PlayerColor.RED;
const BLUE = PlayerColor.BLUE;

describe("FAC51", () => {
  let context: InjectionContext;
  let state: StateStore;

  beforeEach(() => {
    context = new InjectionContext("fac51");
    setInjectionContext(context);
    context.get(GameMemory).setGame({ id: 1, gameKey: "fac51", variant: {} });
    state = context.get(StateStore);
    context.get(GameStarter).startGame(
      [1, 2, 3, 4].map((playerId) => ({ playerId })),
      map,
      [],
    );
    state.init(ROUND, 1);
  });

  afterEach(() => setInjectionContext());

  function markers() {
    return DELIVERY_SPACES.map(
      (coordinates) => injectGrid()().get(coordinates)!.getGoods()[0],
    );
  }

  function fixture(firstGoods: Good[] = [], lastGoods: Good[] = []) {
    const start = DELIVERY_SPACES[0];
    const positions = Array.from({ length: 5 }, (_, step) =>
      Coordinates.from({ q: start.q, r: start.r - step }),
    );
    const spaces: MutableSpaceData[] = [
      {
        ...city("Supply", [], undefined, 0),
        goods: [Good.RED],
        mapSpecific: { delivery: true },
      },
      {
        type: SpaceType.PLAIN,
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [RED],
        },
      },
      { ...city("Station A", [], undefined, 0), goods: firstGoods },
      {
        type: SpaceType.PLAIN,
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [BLUE],
        },
      },
      { ...city("Station B", [], undefined, 0), goods: lastGoods },
    ];
    state.set(
      GRID,
      new Map(
        positions.map((coordinates, index) => [coordinates, spaces[index]]),
      ),
    );
    const player: PlayerData = {
      playerId: 1,
      color: RED,
      income: 0,
      shares: 2,
      money: 10,
      locomotive: 3,
    };
    injectAllPlayersUnsafe().upsert([
      player,
      { ...player, playerId: 2, color: BLUE },
    ]);
    state.upsert(CURRENT_PLAYER, RED);
    state.set(
      MANIFEST,
      new Map([
        [RED, 0],
        [BLUE, 0],
      ]),
    );
    const move: MoveData = {
      startingCity: start,
      good: Good.RED,
      path: [
        { endingStop: positions[2], owner: RED },
        { endingStop: positions[4], owner: BLUE },
      ],
    };
    return { player, move, positions };
  }

  it("preserves every SVG hex, its position and terrain role", () => {
    const svg = readFileSync(resolve(__dirname, "board.svg"), "utf8");
    const hexes = [...svg.matchAll(/<g\b[^>]*data-type="[^"]*"[^>]*>/g)];
    expect(map.size).toBe(145);
    expect(hexes).toHaveLength(map.size);
    for (const [tag] of hexes) {
      const attr = (name: string) =>
        tag.match(new RegExp(`${name}="([^"]*)"`))![1];
      const q = 25 - Number(attr("data-row"));
      const r = Math.round(
        ((Number(attr("data-x")) - 553.5125) / 16.8875 + 15 - q) / 2,
      );
      const space = map.get(Coordinates.from({ q, r }));
      expect(space).toBeDefined();
      if (attr("data-type") === "city") {
        expect(space!.type).toBe(SpaceType.CITY);
      } else if (attr("data-type") === "town") {
        expect(space!.type !== SpaceType.CITY && space!.townName).toBeTruthy();
      } else if (attr("data-terrain") === "mountain") {
        expect(space!.mapSpecific?.delivery).toBe(true);
      } else {
        expect(space!.type).toBe(SpaceType.PLAIN);
      }
    }
  });

  it("starts with six reusable markers, all five colours, and empty colourless stations", () => {
    expect(markers()).toHaveLength(6);
    expect(new Set(markers())).toEqual(new Set(allGoods));
    expect(
      [...injectGrid()().values()].filter((space) => space.getGoods().length),
    ).toHaveLength(6);
    expect(state.get(AVAILABLE_CITIES)).toHaveLength(1);
    expect(state.get(NEW_CITY_SUPPLY)).toBe(8);
    expect(
      state
        .get(AVAILABLE_CITIES)
        .every(
          (space) =>
            Array.isArray(space.color) &&
            !space.color.length &&
            !space.goods.length &&
            !space.onRoll.length,
        ),
    ).toBe(true);
  });

  it("blocks exactly the confirmed action for each of seven rounds", () => {
    const actions = context.get(AllowedActions);
    for (let round = 1; round <= 7; round++) {
      state.set(ROUND, round);
      expect(
        BLOCKED_ACTIONS.filter((action) => actions.isActionDisabled(action)),
      ).toEqual([BLOCKED_ACTIONS[round - 1]]);
    }
    expect(context.get(RoundEngine).maxRounds()).toBe(7);
  });

  it("charges river base costs, normal complex surcharges, and £1 plus town exits", () => {
    const { positions } = fixture();
    state.set(
      GRID,
      new Map([
        [positions[1], { type: SpaceType.PLAIN }],
        [positions[3], town("Crane")],
      ]),
    );
    const calculator = context.get(BuildCostCalculator);
    expect(
      calculator.costOf(positions[1], SimpleTileType.STRAIGHT, Direction.TOP),
    ).toBe(3);
    expect(
      calculator.costOf(positions[1], ComplexTileType.X, Direction.TOP),
    ).toBe(5);
    expect(
      calculator.costOf(positions[3], TownTileType.THREE_WAY, Direction.TOP),
    ).toBe(4);
  });

  it("forbids building on delivery endpoints", () => {
    expect(
      context.get(Validator).getInvalidBuildReason(DELIVERY_SPACES[0], {
        tileType: SimpleTileType.STRAIGHT,
        orientation: Direction.TOP,
        playerColor: RED,
      }),
    ).toBeDefined();
  });

  it("retains the source marker, accumulates the delivered cube and pays each link owner", () => {
    const { move, positions } = fixture([Good.RED]);
    context.get(MoveValidator).validate(injectAllPlayersUnsafe()()[0], move);
    const bag = [...state.get(BAG)];
    context.get(MoveAction).process(move);
    expect(injectGrid()().get(positions[0])!.getGoods()).toEqual([Good.RED]);
    expect(injectGrid()().get(positions[2])!.getGoods()).toEqual([Good.RED]);
    expect(injectGrid()().get(positions[4])!.getGoods()).toEqual([Good.RED]);
    expect(injectAllPlayersUnsafe()().map((player) => player.income)).toEqual([
      1, 1,
    ]);
    expect(state.get(MANIFEST).get(RED)).toBe(0);
    expect(state.get(BAG)).toEqual(bag);
  });

  it("charges one Manifest step for each skipped station missing the colour", () => {
    const { player, move } = fixture();
    context.get(MoveValidator).validate(player, move);
    context.get(MoveAction).process(move);
    expect(state.get(MANIFEST).get(RED)).toBe(1);
    expect(
      context
        .get(PlayerHelper)
        .getScoreBreakdown(player)
        .get("Manifest penalty"),
    ).toBe(-1);
  });

  it("allows reaching level six but prevents a seventh skip", () => {
    const { player, move } = fixture();
    state.set(MANIFEST, new Map([[RED, 5]]));
    expect(() =>
      context.get(MoveValidator).validate(player, move),
    ).not.toThrow();
    context.get(MoveAction).process(move);
    expect(state.get(MANIFEST).get(RED)).toBe(6);
    expect(
      context
        .get(PlayerHelper)
        .getScoreBreakdown(player)
        .get("Manifest penalty"),
    ).toBe(-21);
    expect(() => context.get(MoveValidator).validate(player, move)).toThrow(
      /Manifest/,
    );
  });

  it("clears all five colours only after the fifth delivery pays income", () => {
    const { move, positions } = fixture(
      [Good.RED],
      [...allGoods].filter((good) => good !== Good.RED),
    );
    context.get(MoveAction).process(move);
    expect(injectGrid()().get(positions[4])!.getGoods()).toEqual([]);
    expect(injectAllPlayersUnsafe()().map((player) => player.income)).toEqual([
      1, 1,
    ]);
  });

  it("rejects collected goods as origins, duplicate destinations, supply destinations and excessive locomotive lengths", () => {
    const { player, move, positions } = fixture([], [Good.RED]);
    const validator = context.get(MoveValidator);
    expect(() => validator.validate(player, move)).toThrow(
      /cannot be delivered/,
    );
    expect(() =>
      validator.validate(player, { ...move, startingCity: positions[4] }),
    ).toThrow(/Deliveries/);
    expect(() =>
      validator.validateEnd({
        ...move,
        path: [{ endingStop: move.startingCity, owner: RED }],
      }),
    ).toThrow(/cannot be delivered/);
    expect(() =>
      validator.validate({ ...player, locomotive: 1 }, move),
    ).toThrow(/loco/);
  });

  it("finds both a short delivery and a longer route that spends a Manifest step", () => {
    const { player, positions } = fixture();
    // This fixture retains one supply endpoint, so make the unused marker endpoints empty.
    const cells = new Map(state.get(GRID));
    for (const coordinates of DELIVERY_SPACES.slice(1)) {
      cells.set(coordinates, {
        ...city("Supply", [], undefined, 0),
        mapSpecific: { delivery: true },
      });
    }
    state.set(GRID, cells);
    const moves = context.get(MoveSearcher).findAllRoutes(player);
    expect(moves.map((move) => move.path.length).sort()).toEqual([1, 2]);
    expect(
      moves.some((move) => move.path.at(-1)!.endingStop === positions[4]),
    ).toBe(true);
  });

  it("offers Production only to its owner and rotates markers without any goods growth", () => {
    const phase = context.get(GoodsGrowthPhase);
    expect(phase.getPlayerOrder()).toEqual([]);
    const players = injectAllPlayersUnsafe()().map((player, index) => ({
      ...player,
      selectedAction: index === 0 ? Action.PRODUCTION : undefined,
    }));
    injectAllPlayersUnsafe().upsert(players);
    expect(phase.getPlayerOrder()).toEqual([players[0].color]);
    const before = markers();
    phase.onEnd();
    expect(markers()).toEqual([before[5], ...before.slice(0, 5)]);
    for (let i = 0; i < 5; i++) {
      phase.onEnd();
    }
    expect(markers()).toEqual(before);
  });

  it("Production changes only one duplicated marker to a different valid colour", () => {
    const before = markers();
    const duplicate = before.find(
      (good) => before.filter((other) => other === good).length === 2,
    )!;
    const index = before.indexOf(duplicate);
    const uniqueIndex = before.findIndex((good) => good !== duplicate);
    const replacement = [...allGoods].find((good) => good !== duplicate)!;
    const action = context.get(ChangeDeliveryAction);
    expect(() =>
      action.validate({
        coordinates: DELIVERY_SPACES[uniqueIndex],
        good: replacement,
      }),
    ).toThrow(/duplicated/);
    expect(() =>
      action.validate({ coordinates: DELIVERY_SPACES[index], good: duplicate }),
    ).toThrow(/different/);
    const data = { coordinates: DELIVERY_SPACES[index], good: replacement };
    action.validate(data);
    state.upsert(CURRENT_PLAYER, injectAllPlayersUnsafe()()[0].color);
    action.process(data);
    expect(markers()[index]).toBe(replacement);
    expect(new Set(markers())).toEqual(new Set(allGoods));
  });

  it("urbanises a town as an empty colourless assembly station", () => {
    const { positions } = fixture();
    const cells = new Map(state.get(GRID));
    cells.set(positions[4], town("Crane"));
    state.set(GRID, cells);
    state.init(BUILD_STATE, {
      previousBuilds: [],
      buildCount: 0,
      hasUrbanized: false,
      danglers: [],
    });
    const action = context.get(UrbanizeAction);
    const data = { coordinates: positions[4], cityIndex: 0 };
    action.validate(data);
    action.process(data);
    const station = state.get(GRID).get(positions[4])!;
    expect(station.type === SpaceType.CITY && station.color).toEqual([]);
    expect(station.goods).toEqual([]);
    expect(state.get(AVAILABLE_CITIES)).toHaveLength(1);
    expect(state.get(NEW_CITY_SUPPLY)).toBe(7);
  });

  it("uses FAC51 urbanisation only for FAC51, leaving every other map's action intact", () => {
    expect(context.get(UrbanizeAction)).toBeInstanceOf(Fac51UrbanizeAction);
    for (const settings of MapRegistry.singleton.values()) {
      if (settings.key === "fac51") {
        continue;
      }
      const otherContext = new InjectionContext(settings.key);
      setInjectionContext(otherContext);
      expect(otherContext.get(UrbanizeAction)).not.toBeInstanceOf(
        Fac51UrbanizeAction,
      );
      expect(otherContext.get(StateStore)).not.toBeInstanceOf(Fac51StateStore);
    }
  });

  it("prompts only when passing a city would advance the Manifest", () => {
    const { move } = fixture();
    const interceptor = context.get(MoveInterceptor);
    expect(interceptor.shouldInterceptMove(move, "Station B")).toBe(true);
    expect(
      interceptor.shouldInterceptMove(
        { ...move, path: move.path.slice(0, 1) },
        "Station A",
      ),
    ).toBe(false);
    const duplicate = fixture([Good.RED]);
    expect(interceptor.shouldInterceptMove(duplicate.move, "Station B")).toBe(
      false,
    );
  });

  it("offers one choice until the last city tile is consumed", () => {
    const { positions } = fixture();
    state.set(NEW_CITY_SUPPLY, 2);
    state.init(BUILD_STATE, {
      previousBuilds: [],
      buildCount: 0,
      hasUrbanized: false,
      danglers: [],
    });
    const action = context.get(UrbanizeAction);
    for (let remaining = 1; remaining >= 0; remaining--) {
      const cells = new Map(state.get(GRID));
      cells.set(positions[4], town("Crane"));
      state.set(GRID, cells);
      action.validate({ coordinates: positions[4], cityIndex: 0 });
      action.process({ coordinates: positions[4], cityIndex: 0 });
      expect(state.get(NEW_CITY_SUPPLY)).toBe(remaining);
      expect(state.get(AVAILABLE_CITIES)).toHaveLength(remaining ? 1 : 0);
    }
    expect(() =>
      action.validate({ coordinates: positions[2], cityIndex: 0 }),
    ).toThrow();
  });

  it("loads old games and undo snapshots with one choice and the exact remaining supply", () => {
    const old = JSON.parse(state.serialize());
    delete old.gameData[NEW_CITY_SUPPLY.name];
    old.gameData[AVAILABLE_CITIES.name] = Array.from({ length: 6 }, () => ({
      color: [],
      goods: [],
      onRoll: [],
    }));
    state.merge(JSON.stringify(old));
    expect(state.get(AVAILABLE_CITIES)).toHaveLength(1);
    expect(state.get(NEW_CITY_SUPPLY)).toBe(6);
    const normalized = state.serialize();
    state.merge(normalized);
    expect(state.serialize()).toBe(normalized);
  });

  it("uses the supplied Manifest penalty scale", () => {
    expect(MANIFEST_PENALTIES).toEqual([0, 1, 3, 6, 10, 15, 21]);
  });

  it("charges multiple skips in one delivery and leaves skipped stations unchanged", () => {
    const { player, move, positions } = fixture();
    const cells = new Map(state.get(GRID));
    const track = positions[4].neighbor(Direction.TOP);
    const destination = track.neighbor(Direction.TOP);
    cells.set(track, {
      type: SpaceType.PLAIN,
      tile: {
        tileType: SimpleTileType.STRAIGHT,
        orientation: Direction.TOP,
        owners: [RED],
      },
    });
    cells.set(destination, city("Station C", [], undefined, 0));
    state.set(GRID, cells);
    move.path.push({ endingStop: destination, owner: RED });
    context.get(MoveValidator).validate(player, move);
    context.get(MoveAction).process(move);
    expect(state.get(MANIFEST).get(RED)).toBe(2);
    expect(injectGrid()().get(positions[2])!.getGoods()).toEqual([]);
    expect(injectGrid()().get(positions[4])!.getGoods()).toEqual([]);
    expect(injectGrid()().get(destination)!.getGoods()).toEqual([Good.RED]);
  });

  it.each([4, 5, 6])(
    "completes all seven rounds with %i players, rotating once per round",
    (count) => {
      // Exercise the real phase lifecycle, including rounds with and without Production.
      state.reset();
      const engine = context.get(GameEngine);
      engine.start(
        Array.from({ length: count }, (_, i) => ({ playerId: i + 1 })),
        map,
        [],
      );
      // Keep this lifecycle test independent of financing and bankruptcy.
      context.get(PlayerHelper).updateInGamePlayers((player) => {
        player.money = 1000;
      });
      const initialMarkers = markers();
      const seen = new Set<number>();
      for (let action = 0; action < 400 && !engine.hasEnded(); action++) {
        seen.add(state.get(ROUND));
        switch (state.get(PHASE)) {
          case Phase.SHARES:
            engine.processAction("takeShares", { numShares: 0 });
            break;
          case Phase.ACTION_SELECTION:
            engine.processAction("select", {
              action: context.get(AllowedActions).getAvailableActions().first(),
            });
            break;
          case Phase.BUILDING:
            engine.processAction("done", {});
            break;
          default:
            engine.processAction("pass", {});
        }
      }
      expect(engine.hasEnded()).toBe(true);
      expect(state.get(PHASE)).toBe(Phase.END_GAME);
      expect([...seen]).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(markers()).toEqual([
        initialMarkers[5],
        ...initialMarkers.slice(0, 5),
      ]);
      expect(
        injectAllPlayersUnsafe()().every((player) => !player.outOfGame),
      ).toBe(true);
    },
  );
});
