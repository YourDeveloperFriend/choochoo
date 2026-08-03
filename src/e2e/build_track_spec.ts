import { Page, expect, test } from "@playwright/test";
import {
  createStartedGame,
  deleteGame,
  fetchGame,
  loginAs,
  seedUsers,
  waitForVersionAfter,
} from "./util/app";

/**
 * Building track: that clicking the grid reaches the engine.
 *
 * This is the spec the browser is actually needed for. Whether a build is legal,
 * what it costs, and what the board looks like afterwards are all engine
 * questions, covered in process and in far more depth by the recorded
 * playthroughs. What only a browser can show is that the hex is clickable, that
 * it offers the builds the engine says are available, and that choosing one sends
 * an action the server accepts.
 *
 * So nothing here names a tile type or a coordinate. The spec finds a hex that
 * offers builds, takes the first one offered, and checks the game moved on. That
 * keeps it from failing every time a map's terrain or tile rules are adjusted --
 * the kind of breakage that made the old suite not worth fixing.
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

  // Play the opening until somebody is asked to build. Jamaica's order is turn
  // order, then shares, then action selection, then building; each is a single
  // click for a player with no ambitions.
  const builder = await advanceToBuilding(page, users, game.id);

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

/** The button shown only to the player who is being asked to build. */
function doneBuilding(page: Page) {
  return page.getByRole("button", { name: "Done Building" });
}

/** How many builds the page says the current player has left. */
async function buildsRemaining(page: Page): Promise<number> {
  const text = await page
    .getByText(/You can build \d+ more track tile/)
    .innerText();
  const match = /You can build (\d+) more track tile/.exec(text);
  if (match == null)
    throw new Error(`could not read builds left from "${text}"`);
  return Number(match[1]);
}

/**
 * Clicks through the opening until the active player is asked to build.
 *
 * Which player that is changes as the phases go by, so this logs in as whoever
 * the server says is active. Driving it by what is on screen, rather than by
 * reading the engine's phase, keeps the spec off the engine's internals.
 */
async function advanceToBuilding(
  page: Page,
  users: Awaited<ReturnType<typeof seedUsers>>,
  gameId: number,
) {
  // Bounded so a rule change that leaves the game waiting fails here, loudly,
  // rather than hanging.
  for (let step = 0; step < 12; step++) {
    const game = await fetchGame(page.request, gameId);
    const active = users.find((user) => user.id === game.activePlayerId);
    if (active == null) {
      throw new Error(
        `game ${gameId} has no active player among the seeded ones`,
      );
    }

    await loginAs(page, active, `/app/games/${gameId}`);
    await waitForGamePage(page);

    // Action selection has no pass: a player must take one of the special
    // actions, so it is handled separately from the phases that can be waved
    // through.
    const selectable = page.locator("[data-special-action][data-selectable]");
    if ((await selectable.count()) > 0) {
      await selectable.first().click();
      await waitForVersionAfter(page.request, gameId, game.version);
      continue;
    }

    // Whichever of the opening's minimal choices is on offer, or the build button
    // if the opening is over. Waited for as one locator: checking each in turn
    // without waiting races the client's first render, which is a single-page app
    // still fetching the game when the navigation commits.
    const choice = page
      .getByRole("button", { name: /^(Take Shares|Skip|Pass|Done Building)$/ })
      .first();
    await expect(choice).toBeVisible({ timeout: 30_000 });

    if ((await choice.innerText()).trim() === "Done Building") return active;

    await choice.click();
    await waitForVersionAfter(page.request, gameId, game.version);
  }
  throw new Error("never reached the building phase");
}

/**
 * Waits for the client to have actually drawn the game.
 *
 * loginAs only waits for the navigation to commit, which for a single-page client
 * is well before there is anything on screen.
 */
async function waitForGamePage(page: Page): Promise<void> {
  await expect(page.locator("[data-hex-grid]")).toBeVisible({
    timeout: 30_000,
  });
}

/**
 * Builds the first tile the server accepts.
 *
 * Nothing here names a coordinate or a tile type. The dialog offers every tile
 * that fits the terrain, including ones the server then refuses -- new track has
 * to leave a city or extend existing track, and the client does not check that --
 * so the spec tries candidates and stops when the game actually moves on.
 *
 * That is slower than naming a known-good hex, but it survives a reseeded board
 * or a change to a map's terrain, which is the kind of breakage that made the old
 * suite not worth repairing.
 */
async function buildFirstLegalTile(
  page: Page,
  gameId: number,
  fromVersion: number,
): Promise<void> {
  const hexes = page.locator("[data-hex-grid] [data-coordinates]");
  const count = await hexes.count();
  expect(count, "the grid rendered no hexes").toBeGreaterThan(0);

  const options = page.locator("[data-building-options]");
  for (let hex = 0; hex < count; hex++) {
    await hexes.nth(hex).click({ force: true });
    if (!(await isShowing(options))) continue;

    const tiles = options.locator("[data-tile-type][data-orientation]");
    for (let tile = 0, tiles_ = await tiles.count(); tile < tiles_; tile++) {
      // force, because a rejected build leaves a toast sitting over the dialog.
      await tiles.nth(tile).click({ force: true });
      if (await versionAdvanced(page, gameId, fromVersion)) return;
      await dismissErrors(page);
      if (!(await isShowing(options))) break;
    }

    await page.keyboard.press("Escape");
  }
  throw new Error(
    `tried every one of the ${count} hexes and the server accepted no build`,
  );
}

async function isShowing(locator: ReturnType<Page["locator"]>) {
  return locator.isVisible().catch(() => false);
}

/** Whether the game moved on, i.e. the server took the action. Short by design. */
async function versionAdvanced(
  page: Page,
  gameId: number,
  fromVersion: number,
): Promise<boolean> {
  const deadline = Date.now() + 2_000;
  do {
    if ((await fetchGame(page.request, gameId)).version > fromVersion) {
      return true;
    }
  } while (Date.now() < deadline);
  return false;
}

/**
 * Clears rejection notices.
 *
 * A refused build raises a toast, and they stack up over the dialog until nothing
 * beneath them can be clicked -- which is how this spec first failed.
 */
async function dismissErrors(page: Page): Promise<void> {
  const closers = page.locator('.Toastify__toast button[aria-label="close"]');
  for (let i = await closers.count(); i > 0; i--) {
    await closers
      .first()
      .click({ force: true })
      .catch(() => {});
  }
}
