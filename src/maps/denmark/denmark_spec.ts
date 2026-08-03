import { expect, test } from "@playwright/test";
import {
  createStartedGame,
  deleteGame,
  fetchGame,
  seedUsers,
  waitForVersionAfter,
} from "../../e2e/util/app";
import {
  applyScript,
  doneBuilding,
  isShowing,
  openAsActivePlayer,
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

/**
 * The position that puts instant production on screen.
 *
 * Instant production fires once a delivery completes, so a spec cannot simply
 * open a fresh game and look at it. Rather than click a whole round out, this
 * fast-forwards with the shortest script that gets there: nobody takes shares,
 * nobody bids, each player takes whatever action is going, the first builder
 * claims one ferry and everyone stops building. Then one delivery over that
 * ferry, and the modal is waiting.
 *
 * The seed is not arbitrary. Whether a delivery exists at all depends on which
 * cubes the board was dealt, so seeds were searched until one turned up where the
 * ferry's two cities allow a delivery in round one. That is what keeps the script
 * to thirteen actions.
 *
 * If this script stops applying, the game no longer reaches this position the same
 * way -- a rules change, or a different colour assignment. The failure names the
 * step, and the search that produced it can be run again.
 */
const INSTANT_PRODUCTION_SEED = "denmark-ip-0";
const FERRY_ID = "5";
const OPENING: Array<{ actionName: string; actionData: unknown }> = [
  { actionName: "takeShares", actionData: { numShares: 0 } },
  { actionName: "takeShares", actionData: { numShares: 0 } },
  { actionName: "takeShares", actionData: { numShares: 0 } },
  { actionName: "pass", actionData: {} },
  { actionName: "pass", actionData: {} },
  { actionName: "select", actionData: { action: 1 } },
  { actionName: "select", actionData: { action: 2 } },
  { actionName: "select", actionData: { action: 3 } },
  // Frederikshaven to Copenhagen.
  { actionName: "connect-cities", actionData: { id: FERRY_ID } },
  { actionName: "done", actionData: {} },
  { actionName: "done", actionData: {} },
  { actionName: "done", actionData: {} },
  // The delivery that triggers instant production. The owner is a player colour,
  // which the fixed seed pins down.
  {
    actionName: "move",
    actionData: {
      startingCity: { q: 9, r: 5 },
      good: 4,
      path: [{ owner: 4, endingStop: { q: 1, r: 14 } }],
    },
  },
];

test("offers a city for instant production after a delivery", async ({
  page,
}) => {
  const api = page.request;
  const users = await seedUsers(api, PLAYERS);
  const name = `e2e dk ip ${Date.now()}`.slice(0, 32);

  const game = await createStartedGame(page, users, {
    gameKey: GAME_KEY,
    name,
    seed: INSTANT_PRODUCTION_SEED,
  });
  created.push(game.id);

  await applyScript(page, users, game.id, OPENING);

  const pending = await openAsActivePlayer(page, users, game.id);
  await expect(
    page.locator("[data-instant-production]"),
    "a delivery should leave instant production waiting",
  ).toBeVisible({ timeout: 30_000 });

  // Not scoped to the container above: the dialog is a Semantic UI Modal, which
  // renders through a portal on the body rather than inside its own subtree.
  const cities = page.locator("[data-city-option]");
  // The choice is between the two ends of the delivery, and only those.
  await expect(cities).toHaveCount(2, { timeout: 30_000 });

  // Confirming is refused until one is picked, which is the modal's own rule
  // rather than the engine's.
  const confirm = page.getByRole("button", { name: "Select City" });
  await expect(confirm).toBeDisabled();

  const chosen = await cities.first().getAttribute("data-city-option");
  await cities.first().click();
  await expect(confirm).toBeEnabled();

  const before = await fetchGame(api, game.id);
  await confirm.click();

  // The engine took it: the game moved on and the modal is done with.
  const after = await waitForVersionAfter(api, game.id, before.version);
  expect(after.version).toBeGreaterThan(before.version);
  // The choice is spent, so the dialog has nothing left to offer.
  await expect(cities).toHaveCount(0, { timeout: 30_000 });

  expect(chosen, "a city option should name its coordinates").toMatch(
    /^-?\d+\|-?\d+$/,
  );
  expect(pending.id).toBeTruthy();
});
