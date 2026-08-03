import { createExpressEndpoints, initServer } from "@ts-rest/express";
import express from "express";
import { gameExportContract } from "../../api/export";
import { UserRole } from "../../api/user";
import { assert } from "../../utils/validate";
import { assertRole } from "../util/enforce_role";
import { GameDao } from "./dao";
import { toGameExport } from "./export";
import { GameHistoryDao } from "./history_dao";

export const gameExportApp = express();

/**
 * Exports a finished game as the list of actions that produced it.
 *
 * The intended consumer is the test corpus: each exported game becomes a
 * regression test that replays it from its seed. The existing history endpoint
 * is not enough for that -- it returns the state at each step but not the action
 * data or the seed that produced it.
 *
 * Admin only. It is a tooling endpoint, and it exposes every player's moves for
 * a game that may still be running, which the normal history view does not.
 */
const router = initServer().router(gameExportContract, {
  async get({ req, params }) {
    await assertRole(req, UserRole.enum.ADMIN);

    const [game, histories] = await Promise.all([
      GameDao.findByPk(params.gameId),
      GameHistoryDao.findAll({
        where: { gameId: params.gameId },
        order: [["previousGameVersion", "ASC"]],
      }),
    ]);
    assert(game != null, { notFound: true });

    return { status: 200, body: { game: toGameExport(game, histories) } };
  },
});

createExpressEndpoints(gameExportContract, router, gameExportApp);
