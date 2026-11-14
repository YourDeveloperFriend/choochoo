import { ActionNamingProvider, ActionZod } from "../../engine/state/action";
import { PhaseNamingProvider, PhaseZod } from "../../engine/state/phase";
import { MauiMapSettings } from "../maui/settings";
import { IsleOfWightMapSettings } from "../isle_of_wight/settings";
import { WAGGLE_DANCE_PHASE } from "./phases";
import { WAGGLE_DANCE, DOMINANT_WORKER_BEE } from "./actions";
import { Log } from "../../engine/game/log";
import { describe, expect, it } from "vitest";
import { EngineDelegator, GameState } from "../../engine/framework/engine";
import { inject, injectState } from "../../engine/framework/execution_context";
import { StateStore } from "../../engine/framework/state";
import { RoundEngine } from "../../engine/game/round";
import { PlayerHelper } from "../../engine/game/player";
import { PHASE } from "../../engine/game/phase";
import { PhaseEngine } from "../../engine/game/phase";
import {
  BAG,
  AVAILABLE_CITIES,
  CURRENT_PLAYER,
  injectGrid,
  injectAllPlayersUnsafe,
} from "../../engine/game/state";
import { BuildPhase } from "../../engine/build/phase";
import { BuildAction } from "../../engine/build/build";
import { ConnectCitiesAction } from "../../engine/build/connect_cities";
import { BuilderHelper } from "../../engine/build/helper";
import { UrbanizeAction } from "../../engine/build/urbanize";
import { BuildCostCalculator } from "../../engine/build/cost";
import { GridHelper } from "../../engine/map/grid_helper";
import { City } from "../../engine/map/city";
import { Land } from "../../engine/map/location";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MoveSearcher } from "../../engine/move/searcher";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { MoveValidator } from "../../engine/move/validator";
import { Action } from "../../engine/state/action";
import { Good } from "../../engine/state/good";
import { PlayerColor } from "../../engine/state/player";
import { Phase } from "../../engine/state/phase";
import { CityGroup } from "../../engine/state/city_group";
import { SpaceType } from "../../engine/state/location_type";
import {
  SimpleTileType,
  ComplexTileType,
  Direction,
  allDirections,
  TownTileType,
} from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";
import { calculateTrackInfo } from "../../engine/map/location";
import { readGame } from "../../testing/harness/read_game";
import { HONEYBEE_HIVE_MIND_KEY as key } from "./identity";
import { boardCoordinates as c } from "./grid";
import { centralLinks } from "./connections";
import { WaggleAction, WaggleData } from "./waggle";
import { beeFee } from "./move";

const colors = [
  PlayerColor.RED,
  PlayerColor.BLUE,
  PlayerColor.YELLOW,
  PlayerColor.GREEN,
  PlayerColor.PURPLE,
];
function start(count = 5): GameState {
  return EngineDelegator.singleton.start({
    game: { id: 1, gameKey: key, variant: {} },
    seed: "honeybee-focused",
    players: colors
      .slice(0, count)
      .map((color, i) => ({ playerId: i + 1, preferredColors: [color] })),
  });
}
function read<T>(game: GameState, fn: () => T): T {
  return readGame({ gameKey: key, gameData: game.gameData }, fn);
}
function edit(game: GameState, fn: () => void): GameState {
  return {
    ...game,
    gameData: read(game, () => {
      fn();
      return inject(StateStore).serialize();
    }),
  };
}
function building() {
  const color = PlayerColor.RED;
  injectState(CURRENT_PLAYER).set(color);
  inject(PlayerHelper).update(color, (p) => {
    p.money = 100;
    p.selectedAction = Action.URBANIZATION;
  });
  injectState(PHASE).set(Phase.BUILDING);
  inject(BuildPhase).onStartTurn();
}
function connect(id: string) {
  const action = inject(ConnectCitiesAction);
  action.validate({ id });
  action.process({ id });
}
function yellowCount() {
  const grid = injectGrid()();
  const available = injectState(AVAILABLE_CITIES)();
  const goods = [
    ...injectState(BAG)(),
    ...[...grid.values()].flatMap((s) => [
      ...s.getGoods(),
      ...(s instanceof City
        ? s.onRoll().flatMap((roll) => roll.goods.filter((g) => g != null))
        : []),
    ]),
    ...available.flatMap((city) => [
      ...city.goods,
      ...city.onRoll.flatMap((roll) => roll.goods.filter((g) => g != null)),
    ]),
  ];
  return {
    total: goods.length,
    yellow: goods.filter((g) => g === Good.YELLOW).length,
  };
}

// Find a short empty-land route on the actual board, then submit its tiles normally.
function trackRoute(fromId: number, toId: number): Coordinates[] {
  const grid = injectGrid()();
  const starts = grid.cities().filter((city) => city.data.sameCity === fromId);
  const queue = starts.map((city) => [city.coordinates]);
  const visited = new Set(starts.map((city) => city.coordinates.serialize()));
  while (queue.length) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    for (const direction of allDirections) {
      const next = current.neighbor(direction);
      const space = grid.get(next);
      if (
        space instanceof City &&
        space.data.sameCity === toId &&
        path.length > 1
      ) {
        return [...path, next];
      }
      if (
        !(space instanceof Land) ||
        space.hasTown() ||
        space.hasTile() ||
        visited.has(next.serialize())
      ) {
        continue;
      }
      visited.add(next.serialize());
      queue.push([...path, next]);
    }
  }
  throw new Error("No empty route found");
}
function buildRoute(route: Coordinates[], stopBeforeLast = false) {
  const end = route.length - (stopBeforeLast ? 2 : 1);
  const action = inject(BuildAction);
  for (let i = 1; i < end; i++) {
    const coordinates = route[i];
    const exits = [
      coordinates.getDirection(route[i - 1]),
      coordinates.getDirection(route[i + 1]),
    ];
    const options = [
      SimpleTileType.STRAIGHT,
      SimpleTileType.CURVE,
      SimpleTileType.TIGHT,
    ].flatMap((tileType) =>
      allDirections.map((orientation) => ({
        coordinates,
        tileType,
        orientation,
      })),
    );
    const data = options.find((option) =>
      calculateTrackInfo(option)[0].exits.every((exit) =>
        exits.includes(exit as Direction),
      ),
    )!;
    action.validate(data);
    action.process(data);
  }
}

describe("Honeybee Hive Mind", () => {
  it.each([3, 4, 5])(
    "sets up %i players with conserved goods, correct display and link stock",
    (count) => {
      const game = start(count);
      read(game, () => {
        expect(yellowCount()).toEqual({ total: 96, yellow: 20 });
        expect(injectState(BAG)()).not.toContain(Good.YELLOW);
        const grid = injectGrid()();
        expect(
          [...grid.values()].filter((s) => s instanceof Land && s.hasTown()),
        ).toHaveLength(16);
        const originals = [...grid.cities()].filter(
          (city) => city.onRoll().length > 0,
        );
        expect(originals).toHaveLength(12);
        for (const city of originals) {
          const center = city.coordinates.equals(c(6, 6));
          expect(city.getGoods()).toHaveLength(
            city.data.sameCity ? 4 : center ? 2 : 3,
          );
          const roll = city.onRoll()[0];
          expect(roll.goods).toHaveLength(3);
          if (city.data.sameCity) {
            expect(roll.goods).not.toContain(Good.YELLOW);
          } else {
            expect(roll.goods[1]).toBe(Good.YELLOW);
          }
        }
        const available = injectState(AVAILABLE_CITIES)();
        expect(available).toHaveLength(7);
        expect(
          available.every(
            (city) => city.goods.length === (count === 5 ? 1 : 0),
          ),
        ).toBe(true);
        expect(
          available.some((city) =>
            city.onRoll.some(
              (roll) => roll.group === CityGroup.BLACK && roll.onRoll === 1,
            ),
          ),
        ).toBe(false);
        expect(grid.connections).toHaveLength(count === 5 ? 21 : 12);
        expect(inject(RoundEngine).maxRounds()).toBe(
          { 3: 9, 4: 7, 5: 6 }[count],
        );
      });
    },
  );

  it("places Waggle Dance before both delivery circuits and preserves normal phases on Rust Belt", () => {
    read(start(), () => {
      const order = inject(PhaseEngine).phaseOrder();
      expect(order[order.indexOf(Phase.MOVING) - 1]).toBe(WAGGLE_DANCE_PHASE);
    });
    const game = EngineDelegator.singleton.start({
      game: { id: 1, gameKey: "rust-belt", variant: {} },
      players: colors
        .slice(0, 3)
        .map((color, i) => ({ playerId: i + 1, preferredColors: [color] })),
      seed: "base-timing",
    });
    readGame({ gameKey: "rust-belt", gameData: game.gameData }, () =>
      expect(inject(PhaseEngine).phaseOrder()).not.toContain(
        WAGGLE_DANCE_PHASE,
      ),
    );
  });

  it("limits a five-player turn across all three pairings and excludes central claims", () => {
    read(start(), () => {
      building();
      connect("1-2-1");
      connect("1-3-1");
      expect(() =>
        inject(ConnectCitiesAction).validate({ id: "2-3-1" }),
      ).toThrow(/only two/);
      expect(() =>
        inject(ConnectCitiesAction).validate({ id: "1-2-2" }),
      ).toThrow(/only one/);
      connect("0-1-1");
      expect(inject(BuilderHelper).buildsRemaining()).toBe(0);
      inject(BuildPhase).onEndTurn();
      inject(BuildPhase).onStartTurn();
      expect(() =>
        inject(ConnectCitiesAction).validate({ id: "2-3-1" }),
      ).not.toThrow();
      expect(() =>
        inject(ConnectCitiesAction).validate({ id: "0-1-2" }),
      ).toThrow(/only one/);
    });
  });

  it("logs interurban claims in a stable City order with the paid cost", () => {
    for (const [id, label] of [
      ["1-3-1", "Dark 1 and Dark 3"],
      ["2-3-1", "Dark 2 and Dark 3"],
      ["0-1-1", "Dark 1 and Light 5"],
    ]) {
      read(start(), () => {
        building();
        connect(id);
        expect(inject(Log).dump().at(-1)).toContain(
          `claims an interurban link between ${label} for $2`,
        );
      });
    }
  });

  it("allows three pairings with four players and enforces slot capacity", () => {
    read(start(4), () => {
      building();
      connect("1-2-1");
      connect("1-3-1");
      connect("2-3-1");
      inject(BuildPhase).onEndTurn();
      injectState(CURRENT_PLAYER).set(PlayerColor.BLUE);
      inject(BuildPhase).onStartTurn();
      connect("1-2-2");
      expect(() =>
        inject(ConnectCitiesAction).validate({ id: "1-2-1" }),
      ).toThrow(/already connected/);
    });
  });

  it("finds printed interurban routes from either half of a large City", () => {
    read(start(), () => {
      building();
      connect("1-3-1");
      const validator = inject(MoveValidator);
      const destinations = [c(5, 5), c(5, 6)].map((origin) =>
        validator
          .findRoutesFromLocation(origin)
          .filter((route) => route.type === "connection")
          .map((route) => route.destination.serialize()),
      );
      expect(destinations[0]).toEqual(destinations[1]);
      expect(destinations[0]).toContain(c(6, 7).serialize());
    });
  });

  it("allows Urbanization before, during or after building with the standard once-per-turn limit", () => {
    for (const claims of [[], ["1-2-1"], ["1-2-1", "1-3-1", "0-1-1"]]) {
      read(start(), () => {
        building();
        for (const id of claims) {
          connect(id);
        }
        const urbanize = inject(UrbanizeAction);
        const helper = inject(BuilderHelper);
        expect(urbanize.canEmit()).toBe(true);
        expect(helper.canUrbanize()).toBe(true);
        expect(helper.buildsRemaining()).toBe(3 - claims.length);
        // The final build must leave the player able to place the selected City.
        expect(helper.isAtEndOfTurn()).toBe(false);
        urbanize.validate({ coordinates: c(0, 0), cityIndex: 0 });
        urbanize.process({ coordinates: c(0, 0), cityIndex: 0 });
        expect(helper.buildsRemaining()).toBe(3 - claims.length);
        expect(urbanize.canEmit()).toBe(false);
        expect(helper.isAtEndOfTurn()).toBe(claims.length === 3);
      });
    }
  });

  it("charges both terrain types and standard replacement costs correctly", () => {
    read(start(), () => {
      building();
      const calculator = inject(BuildCostCalculator);
      // The hex immediately west of the light-4 black City is dark $3 land.
      const westOfLight4 = injectGrid()().get(c(6, 1));
      expect(westOfLight4?.data.type).toBe(SpaceType.HILL);
      expect(westOfLight4?.data).toMatchObject({ style: "honeybeeDark" });
      expect(
        calculator.costOf(c(6, 1), SimpleTileType.STRAIGHT, Direction.TOP),
      ).toBe(3);
      for (const [coord, base] of [
        [c(0, 1), 2],
        [c(1, 1), 3],
      ] as const) {
        expect(
          calculator.costOf(coord, SimpleTileType.STRAIGHT, Direction.TOP),
        ).toBe(base);
        expect(
          calculator.costOf(
            coord,
            ComplexTileType.COEXISTING_CURVES,
            Direction.TOP,
          ),
        ).toBe(base + 1);
        expect(calculator.costOf(coord, ComplexTileType.X, Direction.TOP)).toBe(
          base + 2,
        );
      }
      inject(GridHelper).update(c(0, 1), (space) => {
        if (space.type !== SpaceType.CITY) {
          space.tile = {
            tileType: ComplexTileType.X,
            orientation: Direction.TOP,
            owners: [PlayerColor.RED, PlayerColor.RED],
          };
        }
      });
      // Choose a replacement for which both old paths change.
      expect(
        calculator.costOf(
          c(0, 1),
          ComplexTileType.COEXISTING_CURVES,
          Direction.TOP,
        ),
      ).toBe(2);
      inject(GridHelper).update(c(0, 1), (space) => {
        if (space.type !== SpaceType.CITY) {
          space.tile = {
            tileType: SimpleTileType.STRAIGHT,
            orientation: Direction.TOP,
            owners: [PlayerColor.RED],
          };
        }
      });
      expect(calculator.costOf(c(0, 1), ComplexTileType.X, Direction.TOP)).toBe(
        3,
      );
      inject(GridHelper).update(c(0, 1), (space) => {
        if (space.type !== SpaceType.CITY) {
          space.townName = "";
          space.tile = {
            tileType: TownTileType.STRAIGHT,
            orientation: Direction.TOP,
            owners: [PlayerColor.RED, PlayerColor.RED],
          };
        }
      });
      expect(
        calculator.costOf(c(0, 1), TownTileType.STRAIGHT, Direction.TOP),
      ).toBe(3);
    });
  });

  it("relocates bees atomically, rejects arrivals as sources and duplicate multihex destinations", () => {
    read(start(), () => {
      const action = inject(WaggleAction);
      const before = yellowCount();
      expect(() =>
        action.validate({
          moves: [
            { from: c(0, 6), to: c(6, 6) },
            { from: c(6, 6), to: c(9, 9) },
          ],
        }),
      ).toThrow(/before Waggle/);
      expect(() =>
        action.validate({
          moves: [
            { from: c(0, 6), to: c(5, 5) },
            { from: c(9, 9), to: c(5, 6) },
          ],
        }),
      ).toThrow(/different destination/);
      expect(() =>
        WaggleData.parse({
          moves: Array(4).fill({ from: c(0, 6), to: c(6, 6) }),
        }),
      ).toThrow();
      const data = {
        moves: [
          { from: c(0, 6), to: c(6, 6) },
          { from: c(9, 9), to: c(5, 6) },
        ],
      };
      action.validate(data);
      action.process(data);
      expect(injectGrid()().get(c(6, 6))!.getGoods()).toContain(Good.YELLOW);
      expect(
        injectGrid()()
          .get(c(5, 5))!
          .getGoods()
          .filter((g) => g === Good.YELLOW),
      ).toHaveLength(2);
      expect(yellowCount()).toEqual(before);
      action.validate({ moves: [] });
    });
  });

  it("orders Honeybee special actions for standard AoS usage", () => {
    read(start(), () => {
      expect(inject(AllowedActions).getActions().toArray()).toEqual([
        Action.FIRST_MOVE,
        Action.FIRST_BUILD,
        Action.ENGINEER,
        Action.LOCOMOTIVE,
        Action.URBANIZATION,
        WAGGLE_DANCE,
        DOMINANT_WORKER_BEE,
        Action.PRODUCTION,
        Action.TURN_ORDER_PASS,
      ]);
    });
  });

  it("filters Move Calculator routes by current cash and waives fees for Dominant Worker Bee", () => {
    read(start(), () => {
      building();
      connect("1-2-1");
      connect("1-3-1");
      connect("0-2-1");
      const helper = inject(GridHelper);
      // A tiny network and two deliverable cubes keep the actual calculator
      // search bounded; no whole-game or repeated full-board searches.
      for (const city of injectGrid()().cities()) {
        helper.update(city.coordinates, (s) => {
          s.goods = [];
        });
      }
      helper.update(c(6, 5), (s) => {
        s.goods = [
          Good.BLUE,
          Good.BLACK,
          Good.YELLOW,
          Good.YELLOW,
          Good.YELLOW,
        ];
      });
      helper.update(c(5, 5), (s) => {
        s.goods = [Good.YELLOW, Good.YELLOW];
      });
      helper.update(c(6, 7), (s) => {
        s.goods = [Good.YELLOW];
      });
      helper.update(c(7, 6), (s) => {
        s.goods = [Good.YELLOW];
      });
      const player = injectAllPlayersUnsafe()().find(
        (p) => p.color === PlayerColor.RED,
      )!;
      const searcher = inject(MoveSearcher);
      for (const [money, selectedAction, canPay] of [
        [0, Action.FIRST_BUILD, false],
        [3, Action.FIRST_BUILD, false],
        [4, Action.FIRST_BUILD, true],
        [0, DOMINANT_WORKER_BEE, true],
      ] as const) {
        const who = { ...player, locomotive: 2, money, selectedAction };
        const routes = searcher.findAllRoutes(who);
        expect(routes.some((route) => route.good === Good.BLUE)).toBe(canPay);
        expect(routes.some((route) => route.good === Good.BLACK)).toBe(true);
        expect(routes.some((route) => route.good === Good.YELLOW)).toBe(false);
        for (const route of routes) {
          expect(beeFee(injectGrid()(), who, route)).toBeLessThanOrEqual(money);
        }
        const delivery = routes.find((route) => route.good === Good.BLUE);
        if (delivery) {
          expect(delivery.path).toHaveLength(2);
          expect(beeFee(injectGrid()(), who, delivery)).toBe(
            selectedAction === DOMINANT_WORKER_BEE ? 0 : 4,
          );
        }
      }
    });
  });

  it("includes destination and transit fees, excludes origin, and debits cash before income", () => {
    read(start(), () => {
      building();
      connect("1-2-1");
      connect("1-3-1");
      const grid = injectGrid()();
      const player = injectAllPlayersUnsafe()().find(
        (p) => p.color === PlayerColor.RED,
      )!;
      const move: MoveData = {
        startingCity: c(6, 5),
        good: Good.BLUE,
        path: [
          { owner: player.color, endingStop: c(5, 5) },
          { owner: player.color, endingStop: c(6, 7) },
        ],
      };
      inject(GridHelper).update(c(6, 5), (s) => s.goods!.push(Good.BLUE));
      inject(PlayerHelper).update(player.color, (p) => {
        p.locomotive = 2;
        p.money = 2;
      });
      expect(beeFee(grid, player, move)).toBe(2);
      expect(() =>
        inject(MoveValidator).validate(
          { ...player, locomotive: 2, money: 1 },
          move,
        ),
      ).toThrow(/Cannot afford/);
      inject(MoveValidator).validate(
        injectAllPlayersUnsafe()().find((p) => p.color === player.color)!,
        move,
      );
      inject(MoveAction).process(move);
      const after = injectAllPlayersUnsafe()().find(
        (p) => p.color === player.color,
      )!;
      expect(after.money).toBe(0);
      expect(after.income).toBe(2);
      expect(
        beeFee(
          injectGrid()(),
          { ...after, selectedAction: DOMINANT_WORKER_BEE },
          move,
        ),
      ).toBe(0);
      expect(() =>
        inject(MoveValidator).validatePartial({ ...after, money: 1 }, move),
      ).toThrow();
    });
  });

  it("persists link allowance and resumes a pending Waggle Dance through real engine actions", () => {
    let game = edit(start(), () => {
      building();
      connect("1-2-1");
      connect("1-3-1");
    });
    expect(() =>
      EngineDelegator.singleton.processAction(key, {
        game: { id: 1, gameKey: key, variant: {}, gameData: game.gameData },
        actionName: "connect-cities",
        actionData: { id: "2-3-1" },
      }),
    ).toThrow(/only two/);
    game = edit(start(), () => {
      injectState(PHASE).set(WAGGLE_DANCE_PHASE);
      injectState(CURRENT_PLAYER).set(PlayerColor.RED);
      inject(PlayerHelper).update(
        PlayerColor.RED,
        (p) => (p.selectedAction = WAGGLE_DANCE),
      );
    });
    const result = EngineDelegator.singleton.processAction(key, {
      game: { id: 1, gameKey: key, variant: {}, gameData: game.gameData },
      actionName: WaggleAction.action,
      actionData: { moves: [] },
    });
    read(result, () => expect(injectState(PHASE)()).toBe(Phase.MOVING));
  });
  it("counts built track and interurban claims together and rejects duplicate physical routes", () => {
    read(start(), () => {
      building();
      inject(PlayerHelper).update(
        PlayerColor.RED,
        (p) => (p.selectedAction = Action.ENGINEER),
      );
      connect("1-2-1");
      const route = trackRoute(1, 3);
      expect(route.length - 2).toBeLessThanOrEqual(2);
      buildRoute(route);
      expect(
        centralLinks(injectGrid()())
          .filter((link) => link.owner === PlayerColor.RED)
          .map((link) => link.pair)
          .sort(),
      ).toEqual(["1-2", "1-3"]);
      expect(() =>
        inject(ConnectCitiesAction).validate({ id: "2-3-1" }),
      ).toThrow(/only two/);
      expect(() =>
        inject(ConnectCitiesAction).validate({ id: "1-3-1" }),
      ).toThrow(/only one/);
    });
    read(start(), () => {
      building();
      inject(PlayerHelper).update(
        PlayerColor.RED,
        (p) => (p.selectedAction = Action.ENGINEER),
      );
      connect("1-2-1");
      const route = trackRoute(1, 2);
      expect(() => buildRoute(route)).toThrow(/only one/);
    });
  });

  it("preserves unused Urbanization after track building and reload", () => {
    const game = edit(start(), () => {
      building();
      const route = trackRoute(1, 2);
      buildRoute(route);
      expect(inject(BuilderHelper).buildCount()).toBeGreaterThanOrEqual(1);
      expect(inject(UrbanizeAction).canEmit()).toBe(true);
    });
    read(game, () => {
      const urbanize = inject(UrbanizeAction);
      expect(urbanize.canEmit()).toBe(true);
      urbanize.validate({ coordinates: c(0, 0), cityIndex: 0 });
      urbanize.process({ coordinates: c(0, 0), cityIndex: 0 });
      expect(urbanize.canEmit()).toBe(false);
    });
  });
});

it("reloads legacy numeric custom actions and phase with Honeybee-local names", () => {
  const game = edit(start(3), () => {
    injectState(PHASE).set(PhaseZod.parse(20));
    inject(PlayerHelper).update(PlayerColor.RED, (player) => {
      player.selectedAction = ActionZod.parse(32);
    });
    inject(PlayerHelper).update(PlayerColor.BLUE, (player) => {
      player.selectedAction = ActionZod.parse(33);
    });
  });
  const reloaded = JSON.parse(JSON.stringify(game));
  read(reloaded, () => {
    expect(WAGGLE_DANCE).toBe(32);
    expect(DOMINANT_WORKER_BEE).toBe(33);
    expect(WAGGLE_DANCE_PHASE).toBe(20);
    expect(injectState(PHASE)()).toBe(WAGGLE_DANCE_PHASE);
    const names = inject(ActionNamingProvider);
    expect(
      names.getActionString(
        inject(PlayerHelper).getPlayer(PlayerColor.RED).selectedAction,
      ),
    ).toBe("Waggle Dance");
    expect(
      names.getActionString(
        inject(PlayerHelper).getPlayer(PlayerColor.BLUE).selectedAction,
      ),
    ).toBe("Dominant Worker Bee");
    expect(names.getActionDescription(WAGGLE_DANCE)).toContain(
      "relocate up to three",
    );
    expect(names.getActionDescription(DOMINANT_WORKER_BEE)).toContain(
      "Ignore bee swarm fees",
    );
    expect(names.getActionString(Action.ENGINEER)).toBe("Engineer");
    expect(inject(PhaseNamingProvider).getPhaseString(Phase.MOVING)).toBe(
      "Move goods",
    );
    expect(
      inject(PhaseNamingProvider).getPhaseString(injectState(PHASE)()!),
    ).toBe("Waggle Dance");
    expect(inject(BuildCostCalculator).constructor).toBe(BuildCostCalculator);
  });
  readGame(
    { gameKey: new MauiMapSettings().key, gameData: game.gameData },
    () => {
      expect(inject(ActionNamingProvider).getActionString(WAGGLE_DANCE)).toBe(
        "Coastal Engineer",
      );
      expect(
        inject(ActionNamingProvider).getActionDescription(WAGGLE_DANCE),
      ).toContain("beaches");
    },
  );
  readGame(
    { gameKey: new IsleOfWightMapSettings().key, gameData: game.gameData },
    () => {
      expect(
        inject(PhaseNamingProvider).getPhaseString(WAGGLE_DANCE_PHASE),
      ).toBe("Scrap");
    },
  );
});
