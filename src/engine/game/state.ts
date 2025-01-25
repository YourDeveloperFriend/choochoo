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
import { MutableSpaceData } from "../state/space";
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

export const GRID = new MapKey<Coordinates, MutableSpaceData>(
  "grid",
  CoordinatesZod.parse,
  MutableSpaceData.parse,
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

export const injectGrid = compose(
  () => ({
    game: inject(GameMemory),
    grid: injectState(GRID),
    connections: injectState(INTER_CITY_CONNECTIONS),
  }),
  ({ grid, game, connections }, previousGrid?: Grid) => {
    if (previousGrid) {
      return previousGrid.merge(grid(), connections() ?? []);
    }
    const settings = MapRegistry.singleton.get(game.getGame().gameKey);
    return Grid.fromData(settings, grid(), connections() ?? []);
  },
);

export const TEST_ONLY_PLAYERS = PLAYERS;
