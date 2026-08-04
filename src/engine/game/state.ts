import z from "zod";
import { MapRegistry } from "../../maps/registry";
import { Coordinates, CoordinatesZod } from "../../utils/coordinates";
import {
  compose,
  composeState,
  inject,
  injectState,
} from "../framework/execution_context";
import { Key, MapKey } from "../framework/key";
import { Grid } from "../map/grid";
import { Action } from "../state/action";
import { MutableAvailableCity } from "../state/available_city";
import { GoodZod } from "../state/good";
import { InterCityConnection } from "../state/inter_city_connection";
import {
  MutablePlayerData,
  PlayerColor,
  PlayerColorZod,
  PlayerData,
} from "../state/player";
import { MutableSpaceData, parseSpaceData } from "../state/space";
import { GameMemory } from "./game_memory";

export const TURN_ORDER = new Key("turnOrder", {
  parse: z.array(PlayerColorZod).parse,
});
export const CURRENT_PLAYER = new Key("currentPlayer", {
  parse: PlayerColorZod.parse,
});
export const BAG = new Key("bag", { parse: z.array(GoodZod).parse });
export const AVAILABLE_CITIES = new Key("availableCities", {
  parse: z.array(MutableAvailableCity).parse,
});

export const GRID_VERSION = new Key("gridVersion", { parse: z.number().parse });

export const GRID = new MapKey<Coordinates, MutableSpaceData>(
  "grid",
  CoordinatesZod.parse,
  parseSpaceData,
);

export const INTER_CITY_CONNECTIONS = new Key("interCityConnections", {
  parse: InterCityConnection.array().parse,
});

const PLAYERS = new Key("players", { parse: z.array(MutablePlayerData).parse });

export const injectPlayersByTurnOrder = composeState(
  [TURN_ORDER, PLAYERS],
  (
    _: PlayerData[] | undefined,
    turnOrder: PlayerColor[],
    players: PlayerData[],
  ) => {
    return turnOrder.map(
      (playerColor) => players.find(({ color }) => color === playerColor)!,
    );
  },
);

export function injectAllPlayersUnsafe() {
  return injectState(PLAYERS);
}

export function injectInitialPlayerCount() {
  const players = injectState(PLAYERS);
  return () => players().length;
}

export const injectInGamePlayers = compose(
  () => injectState(PLAYERS),
  (players) => players().filter((player) => !player.outOfGame),
);

export function injectPlayerAction(action: Action) {
  const players = injectInGamePlayers();
  return () =>
    players().find(({ selectedAction }) => selectedAction === action);
}

export const injectCurrentPlayer = compose(
  () => ({
    currentPlayer: injectState(CURRENT_PLAYER),
    players: injectState(PLAYERS),
  }),
  ({ currentPlayer, players }) =>
    players().find((player) => player.color === currentPlayer())!,
);

const NO_CONNECTIONS: InterCityConnection[] = [];

/**
 * The Grid for the current state, rebuilt only when the underlying state changes.
 *
 * Deliberately not written with `compose`, which re-runs its transform on every
 * call. Rebuilding here means `Grid.merge`, which deep-compares every space's data
 * against the space already built -- affordable once per change, but this getter is
 * called many times per action (every neighbor lookup during route finding goes
 * through it), and re-merging on each call dominated the engine: it was ~80% of a
 * recorded playthrough replay, and the same cost is paid serving a real move.
 *
 * Both inputs come from the StateStore, which replaces a value's reference on
 * write and never mutates in place, so reference equality is a sound test for
 * "unchanged" -- the same assumption `composeState` already makes. When the state
 * has changed we still merge into the previous Grid rather than rebuilding from
 * scratch, so untouched spaces keep their identity.
 */
export function injectGrid(): () => Grid {
  const game = inject(GameMemory);
  const grid = injectState(GRID);
  const connections = injectState(INTER_CITY_CONNECTIONS);

  let memoized:
    | {
        gridData: ReturnType<typeof grid>;
        connectionsData: ReturnType<typeof connections>;
        value: Grid;
      }
    | undefined;

  return () => {
    const gridData = grid();
    const connectionsData = connections();
    if (
      memoized != null &&
      memoized.gridData === gridData &&
      memoized.connectionsData === connectionsData
    ) {
      return memoized.value;
    }

    const value =
      memoized != null
        ? memoized.value.merge(gridData, connectionsData ?? NO_CONNECTIONS)
        : Grid.fromData(
            MapRegistry.singleton.get(game.getGame().gameKey),
            gridData,
            connectionsData ?? NO_CONNECTIONS,
          );
    memoized = { gridData, connectionsData, value };
    return value;
  };
}

export const TEST_ONLY_PLAYERS = PLAYERS;
