import { expect, test } from "@playwright/test";
import {
  createStartedGame,
  deleteGame,
  fetchGame,
  seedUsers,
  waitForVersionAfter,
} from "../../e2e/util/app";
import {
  doneBuilding,
  isShowing,
  playUntil,
  versionAdvanced,
} from "../../e2e/util/play";

/**
 * Denmark's own UI.
 *
 * Map specs live beside the map they cover, so whoever implements a map writes
 * them where they are already working. Playwright picks up maps/<map>/*_spec.ts
 * as well as the general specs under e2e/; the shared driving helpers are in
 * e2e/util/play.
 *
 * Scope is the same as for the general specs: wiring only. Whether a ferry may be
 * claimed, and what it costs, are engine questions, and cheaper to answer in
 * process. What only a browser shows is that the connection is on the board, that
 * it can be clicked, and that clicking it sends an action the server accepts.
 *
 * Denmark is a good first case because its ferry connections between cities are
 * drawn and clicked in a way no base-game map uses.
 *
 * Deliberately not covered here: that Denmark deals everyone negative starting
 * income. It is true, and it caught out an engine invariant once, but it is a fact
 * about the engine rather than about the UI, and asserting it through the player
 * table would mean encoding which of that table's responsive variants is on screen.
 */

const GAME_KEY = "denmark";
// Fixed, so the board and the starting position are the same every run.
const SEED = "e2e-denmark";
// Denmark seats three at the least.
const PLAYERS = 3;

let created: number[] = [];

test.afterEach(async ({ request }) => {
  for (const gameId of created) await deleteGame(request, gameId);
  created = [];
});

test("claims a ferry connection between two cities", async ({ page }) => {
  const api = page.request;
  const users = await seedUsers(api, PLAYERS);
  const name = `e2e denmark ${Date.now()}`.slice(0, 32);

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
    { label: "Denmark's building phase" },
  );

  // Denmark's ferries are drawn as connections between cities rather than as
  // track on a hex, so they are their own click target.
  const unclaimed = page.locator(
    "[data-inter-city-connection]:not([data-connection-owned])",
  );
  await expect(
    unclaimed.first(),
    "Denmark should offer unclaimed ferry connections",
  ).toBeVisible({ timeout: 30_000 });

  const before = await fetchGame(api, game.id);
  const claimed = await claimAffordableConnection(
    page,
    game.id,
    before.version,
  );

  const after = await waitForVersionAfter(api, game.id, before.version);
  expect(after.version).toBeGreaterThan(before.version);
  // The board now shows it owned, which is the render half of the round trip.
  await expect(
    page.locator(
      `[data-inter-city-connection="${claimed}"][data-connection-owned]`,
    ),
  ).toBeVisible({ timeout: 30_000 });
  // Still that player's build phase: claiming a connection is a build, not a pass.
  expect(after.activePlayerId).toBe(builder.id);
});

/**
 * Claims the first ferry the server accepts.
 *
 * Ferries differ in cost, and a player who cannot afford one gets an error rather
 * than a refusal up front, so this tries them in turn rather than assuming the
 * cheapest is first on the board.
 */
async function claimAffordableConnection(
  page: import("@playwright/test").Page,
  gameId: number,
  fromVersion: number,
): Promise<string> {
  const unclaimed = page.locator(
    "[data-inter-city-connection]:not([data-connection-owned])",
  );
  const total = await unclaimed.count();
  expect(total, "no unclaimed ferry connections on the board").toBeGreaterThan(
    0,
  );

  for (let index = 0; index < total; index++) {
    const connection = unclaimed.nth(index);
    const id = await connection.getAttribute("data-inter-city-connection");
    if (id == null) continue;
    // force: an SVG circle, and a previous rejection may have left a toast over it.
    await connection.click({ force: true });
    if (await versionAdvanced(page, gameId, fromVersion)) return id;
  }
  throw new Error(
    `clicked all ${total} unclaimed connections and the server accepted none`,
  );
}
