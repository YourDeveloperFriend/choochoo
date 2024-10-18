
import { z } from 'zod';

import { initContract } from '@ts-rest/core';

export enum GameStatus {
  LOBBY = 'LOBBY',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  ABANDONED = 'ABANDONED',
}

export const CreateGameApi = z.object({
  gameKey: z.string(),
  name: z.string(),
});

export const GameApi = z.object({
  id: z.string(),
  gameKey: z.string(),
  version: z.number(),
  name: z.string(),
  playerIds: z.array(z.string()),
  status: z.nativeEnum(GameStatus),
  gameData: z.string().optional(),
});

export const ListGamesApi = z.object({
  user: z.string().optional(),
  status: z.nativeEnum(GameStatus).optional(),
  gameKey: z.string().optional(),
  name: z.string().optional(),
});

export type ListGamesApi = z.infer<typeof ListGamesApi>;
export type CreateGameApi = z.infer<typeof CreateGameApi>;
export type GameApi = z.infer<typeof GameApi>;
export type GameApiUpdate = z.infer<typeof GameApi>;

const c = initContract();

export const gameContract = c.router({
  get: {
    method: 'GET',
    pathParams: z.object({gameId: z.string()}),
    path: '/:gameId',
    responses: {
      200: z.object({game: GameApi}),
    },
    summary: 'Get a game',
  },
  list: {
    method: 'GET',
    path: `/`,
    responses: {
      200: z.object({games: z.array(GameApi)}),
    },
    query: ListGamesApi,
    summary: 'Get a list of games',
  },
  create: {
    method: 'POST',
    path: '/',
    body: CreateGameApi,
    responses: {
      201: z.object({game: GameApi}),
    },
    summary: 'Creates a game',
  },
  join: {
    method: 'POST',
    pathParams: z.object({gameId: z.string()}),
    path: '/:gameId/join',
    body: z.object({}),
    responses: {
      200: z.object({game: GameApi}),
    },
    summary: 'Joins a game',
  },
  start: {
    method: 'POST',
    pathParams: z.object({gameId: z.string()}),
    path: '/:gameId/start',
    body: z.object({}),
    responses: {
      200: z.object({game: GameApi}),
    },
    summary: 'Joins a game',
  },
  leave: {
    method: 'POST',
    pathParams: z.object({gameId: z.string()}),
    path: '/:gameId/leave',
    body: z.object({}),
    responses: {
      200: z.object({game: GameApi}),
    },
    summary: 'Leaves a game',
  },
  performAction: {
    method: 'POST',
    pathParams: z.object({gameId: z.string()}),
    path: '/:gameId/action',
    body: z.object({
      actionName: z.string(),
      actionData: z.unknown(),
    }),
    responses: {
      200: z.object({game: GameApi}),
    },
    summary: 'Performs an action on a game',
  },
  undoAction: {
    method: 'POST',
    pathParams: z.object({gameId: z.string()}),
    path: '/:gameId/action',
    body: z.object({}),
    responses: {
      200: z.object({game: GameApi}),
    },
    summary: 'Undoes the previous action on a game',
  },
});