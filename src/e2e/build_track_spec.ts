import { expect, test } from "@playwright/test";
import {
  createStartedGame,
  deleteGame,
  fetchGame,
  seedUsers,
  waitForVersionAfter,
} from "./util/app";
import {
  buildFirstLegalTile,
  buildsRemaining,
  doneBuilding,
  isShowing,
  playUntil,
} from "./util/play";

/**
 * Building track: that clicking the grid reaches the engine.
 *
 * This is the spec a browser is actually needed for. Whether a build is legal,
 * what it costs, and what the board looks like afterwards are all engine
 * questions, covered in process and in far more depth by the recorded
 * playthroughs. What only a browser shows is that the hex is clickable, that it
 * offers the builds available, and that choosing one sends an action the server
 * accepts.
 *
 * Nothing here names a tile type or a coordinate, so a reseeded board or retuned
 * terrain does not break it.
 */

const GAME_KEY = "jamaica";
// Fixed so the board is dealt the same way every run.
const SEED = "e2e-build-track";

let created: number[] = [];

test.afterEach(async ({ request }) => {
  for (const gameId of created) await deleteGame(request, gameId);
  created = [];
});

test("builds a track tile from the grid", async ({ page }) => {
  const api = page.request;
  const users = await seedUsers(api, 2);
  const name = `e2e build ${Date.now()}`.slice(0, 32);

  const game = await createStartedGame(page, users, {
    gameKey: GAME_KEY,
    name,
    seed: SEED,
  });
  created.push(game.id);

  const builder = await playUntil(
    page,
    users,
    game.id,
    (page) => isShowing(doneBuilding(page)),
    { label: "the building phase" },
  );

  const before = await fetchGame(api, game.id);
  const remainingBefore = await buildsRemaining(page);
  expect(remainingBefore).toBeGreaterThan(0);

  await buildFirstLegalTile(page, game.id, before.version);

  // Two independent signs the engine took it: the game advanced a version, and
  // the player has one build fewer.
  const after = await waitForVersionAfter(api, game.id, before.version);
  expect(after.version).toBeGreaterThan(before.version);

  await expect
    .poll(() => buildsRemaining(page), {
      timeout: 30_000,
      message: "the builds-remaining count never went down",
    })
    .toBe(remainingBefore - 1);

  // Still that player's turn to build, so the action was a build and not a pass.
  await expect(doneBuilding(page)).toBeVisible();
  expect(after.activePlayerId).toBe(builder.id);
});
