import { initContract } from "@ts-rest/core";
import z from "zod";
import { GameIdParams } from "./game";
import { GameKeyZod } from "./game_key";
import { VariantConfig } from "./variant_config";

/**
 * A game reduced to what is needed to replay it.
 *
 * Replaying starts a fresh game from `seed` and re-emits `actions` in order.
 * Everything else about setup follows from the seed, so nothing about the board
 * has to be captured: the engine uses no clock and no unseeded randomness, and
 * player colour preferences -- the one input that is not the seed -- only affect
 * which player holds which colour, not the board.
 *
 * Colours therefore need not be exported. A replay deals whatever colours the
 * seed produces, and since players are otherwise interchangeable, a consumer
 * relabels the recorded game onto that assignment.
 */
const GameExportAction = z.object({
  /** The version of the game this action was applied to. */
  version: z.number(),
  actionName: z.string(),
  /** The action's payload, as the client sent it. */
  actionData: z.unknown(),
  /**
   * The seed in force for this action, or null if it needed no randomness.
   *
   * Recorded per action rather than per game: the engine generates one lazily
   * the first time an action draws.
   */
  seed: z.string().nullable(),
});

export const GameExportApi = z.object({
  id: z.number(),
  gameKey: GameKeyZod,
  variant: VariantConfig,
  /** Player ids in the order they were handed to the engine at start. */
  playerIds: z.array(z.number()),
  /** The seed the game was started with. */
  startSeed: z.string().nullable(),
  /**
   * The state immediately after setup, as the engine serialized it.
   *
   * Only needed to check that a replay from the seed reproduced the same
   * opening. A consumer that trusts the seed can ignore it.
   */
  startState: z.string().nullable(),
  actions: z.array(GameExportAction),
});
export type GameExportApi = z.infer<typeof GameExportApi>;

export const gameExportContract = initContract().router({
  get: {
    method: "GET",
    pathParams: GameIdParams,
    path: "/games/:gameId/export",
    responses: {
      200: z.object({ game: GameExportApi }),
    },
    summary: "Export a game as a replayable list of actions",
  },
});
