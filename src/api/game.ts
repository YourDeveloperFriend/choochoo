import { z } from "zod";

import { initContract } from "@ts-rest/core";
import { AutoAction } from "../engine/state/auto_action";
import { MapRegistry } from "../maps/registry";
import { TextInputNumber } from "../utils/types";
import { assertNever } from "../utils/validate";
import { GameKey, GameKeyZod } from "./game_key";
import { VariantConfig } from "./variant_config";

export const GameStatus = z.enum(["LOBBY", "ACTIVE", "ENDED", "ABANDONED"]);

export const MapConfig = z.object({
  minPlayers: TextInputNumber,
  maxPlayers: TextInputNumber,
});

export type MapConfig = z.infer<typeof MapConfig>;

export type GameStatus = z.infer<typeof GameStatus>;

export function gameStatusToString(game: GameLiteApi): string {
  if (game.summary != null) return game.summary;
  switch (game.status) {
    case GameStatus.enum.LOBBY:
      return game.playerIds.length === game.config.maxPlayers
        ? "Game full, waiting to start..."
        : "Waiting for players...";
    case GameStatus.enum.ACTIVE:
      return "In progress";
    case GameStatus.enum.ENDED:
      return "Ended";
    case GameStatus.enum.ABANDONED:
      return "Abandoned";
    default:
      assertNever(game.status);
  }
}

const ActionApi = z.object({
  actionName: z.string(),
  actionData: z.unknown(),
  confirmed: z.boolean(),
});

type ActionApi = z.infer<typeof ActionApi>;

function numPlayersMessage(gameKey: GameKey): string {
  const { name, minPlayers, maxPlayers } = MapRegistry.singleton.get(gameKey);

  const range =
    minPlayers === maxPlayers ? `${minPlayers}` : `${minPlayers}-${maxPlayers}`;

  return `${name} only supports ${range} players`;
}

export const CreateGameApi = z
  .object({
    gameKey: GameKeyZod,
    name: z
      .string()
      .trim()
      .min(1)
      .max(32)
      .regex(
        /^[a-zA-Z0-9_\- ]*$/,
        "Can only use letters, numbers, spaces, _, and - characters",
      ),
    variant: VariantConfig,
    turnDuration: z.number(),
    artificialStart: z.boolean(),
    unlisted: z.boolean(),
  })
  .and(MapConfig)
  .refine((data) => data.gameKey === data.variant.gameKey, {
    message: "Game key does not match",
  })
  .refine((data) => data.minPlayers <= data.maxPlayers, {
    message: "Cannot be less than min players",
    path: ["maxPlayers"],
  })
  .refine(
    (data) =>
      data.minPlayers >= MapRegistry.singleton.get(data.gameKey).minPlayers,
    (data) => ({
      message: numPlayersMessage(data.gameKey),
      path: ["minPlayers"],
    }),
  )
  .refine(
    (data) =>
      data.maxPlayers <= MapRegistry.singleton.get(data.gameKey).maxPlayers,
    (data) => ({
      message: numPlayersMessage(data.gameKey),
      path: ["maxPlayers"],
    }),
  );

export type CreateGameApi = z.infer<typeof CreateGameApi>;

const minutes = 1000 * 60;

export enum TurnDuration {
  FIVE_MINUTES = 5 * minutes,
  TEN_MINUTES = 10 * minutes,
  ONE_HOUR = 60 * minutes,
  ONE_DAY = 24 * 60 * minutes,
  TEN_DAYS = 10 * 24 * 60 * minutes,
}

export const allTurnDurations = [
  TurnDuration.FIVE_MINUTES,
  TurnDuration.TEN_MINUTES,
  TurnDuration.ONE_HOUR,
  TurnDuration.ONE_DAY,
  TurnDuration.TEN_DAYS,
];

const TurnDurationZod = z.nativeEnum(TurnDuration);

export function turnDurationToString(duration: number): string {
  switch (duration) {
    case TurnDuration.FIVE_MINUTES:
      return "Five minutes";
    case TurnDuration.TEN_MINUTES:
      return "Ten minutes";
    case TurnDuration.ONE_HOUR:
      return "One hour";
    case TurnDuration.ONE_DAY:
      return "One day";
    case TurnDuration.TEN_DAYS:
      return "Ten days";
    default:
      return `${Math.round(duration / 60000)} minutes`;
  }
}

export const GameLiteApi = z.object({
  id: z.number(),
  gameKey: GameKeyZod,
  name: z.string(),
  playerIds: z.array(z.number()),
  status: GameStatus,
  activePlayerId: z.number().optional(),
  config: MapConfig,
  variant: VariantConfig,
  turnDuration: TurnDurationZod.or(z.number()),
  summary: z.string().optional(),
  unlisted: z.boolean(),
});
export type GameLiteApi = z.infer<typeof GameLiteApi>;

export const GameApi = GameLiteApi.extend({
  version: z.number(),
  turnStartTime: z.string().optional(),
  concedingPlayers: z.number().array(),
  gameData: z.string().optional(),
  undoPlayerId: z.number().optional(),
});
export type GameApi = z.infer<typeof GameApi>;

const OrderByOptions = z.union([z.literal("id"), z.literal("updatedAt")]);

export const GamePageCursor = z.string();
export type GamePageCursor = z.infer<typeof GamePageCursor>;

export const ListGamesApi = z.object({
  userId: z.coerce.number().optional(),
  excludeUserId: z.coerce.number().optional(),
  status: z.array(GameStatus).optional(),
  pageCursor: GamePageCursor.optional(),
  gameKey: z.string().optional(),
  name: z.string().optional(),
  pageSize: z.coerce.number().lte(20).optional(),
  order: z
    .tuple([OrderByOptions, z.union([z.literal("DESC"), z.literal("ASC")])])
    .optional(),
});

export type ListGamesApi = z.infer<typeof ListGamesApi>;

const c = initContract();

export const GameIdParams = z.object({ gameId: z.coerce.number() });

export const gameContract = c.router({
  get: {
    method: "GET",
    pathParams: GameIdParams,
    path: "/games/:gameId",
    responses: {
      200: z.object({ game: GameApi }),
    },
    summary: "Get a game",
  },
  list: {
    method: "GET",
    path: `/games`,
    responses: {
      200: z.object({
        nextPageCursor: GamePageCursor.optional(),
        games: z.array(GameLiteApi),
      }),
    },
    query: ListGamesApi,
    summary: "Get a list of games",
  },
  create: {
    method: "POST",
    path: "/games/",
    body: CreateGameApi,
    responses: {
      201: z.object({ game: GameApi }),
    },
    summary: "Creates a game",
  },
  deleteGame: {
    method: "DELETE",
    pathParams: GameIdParams,
    path: "/games/:gameId",
    body: z.object({}),
    responses: {
      200: z.object({ success: z.literal(true) }),
    },
    summary: "Deletes a game",
  },
  join: {
    method: "POST",
    pathParams: GameIdParams,
    path: "/games/:gameId/join",
    body: z.object({}),
    responses: {
      200: z.object({ game: GameApi }),
    },
    summary: "Joins a game",
  },
  setGameData: {
    method: "PUT",
    pathParams: GameIdParams,
    path: "/games/:gameId/data",
    body: z.object({ gameData: z.string() }),
    responses: {
      200: z.object({ game: GameApi }),
    },
    summary: "Modifies the game data game",
  },
  start: {
    method: "POST",
    pathParams: GameIdParams,
    path: "/games/:gameId/start",
    body: z.object({}),
    responses: {
      200: z.object({ game: GameApi }),
    },
    summary: "Joins a game",
  },
  leave: {
    method: "POST",
    pathParams: GameIdParams,
    path: "/games/:gameId/leave",
    body: z.object({}),
    responses: {
      200: z.object({ game: GameApi }),
    },
    summary: "Leaves a game",
  },
  performAction: {
    method: "POST",
    pathParams: GameIdParams,
    path: "/games/:gameId/action",
    body: ActionApi,
    responses: {
      200: z.object({ game: GameApi, auto: AutoAction }),
    },
    summary: "Performs an action on a game",
  },
  undoAction: {
    method: "POST",
    pathParams: GameIdParams,
    path: "/games/:gameId/undo",
    body: z.object({ backToVersion: z.number(), adminOverride: z.boolean() }),
    responses: {
      200: z.object({ game: GameApi }),
    },
    summary: "Undoes the previous action on a game",
  },
  retryLast: {
    method: "POST",
    pathParams: GameIdParams,
    path: "/games/:gameId/retry",
    body: z.object({ steps: z.number().gt(0) }),
    responses: {
      200: z.object({ game: GameApi }),
    },
    summary: "Retries the last couple of moves of the game",
  },
  concede: {
    method: "POST",
    pathParams: GameIdParams,
    path: "/games/:gameId/concede",
    body: z.object({ concede: z.boolean() }),
    responses: {
      200: z.object({ game: GameApi }),
    },
    summary: "Proposes to concede the current game",
  },
  abandon: {
    method: "POST",
    pathParams: GameIdParams,
    path: "/games/:gameId/abandon",
    body: z.object({}),
    responses: {
      200: z.object({ game: GameApi }),
    },
    summary: "Abandons the game",
  },
  kick: {
    method: "POST",
    pathParams: GameIdParams,
    path: "/games/:gameId/kick",
    body: z.object({}),
    responses: {
      200: z.object({ game: GameApi }),
    },
    summary: "Kicks the current player if they haven't responded in a while",
  },
});
