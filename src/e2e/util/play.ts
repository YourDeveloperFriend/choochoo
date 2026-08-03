import { Locator, Page, expect } from "@playwright/test";
import { fetchGame, loginAs, SeededUser, waitForVersionAfter } from "./app";

/**
 * Driving a game through the browser.
 *
 * Shared by the general specs under src/e2e and by the per-map specs that live
 * beside their map (src/maps/<map>/*_spec.ts). A map spec usually wants to reach
 * some position its own rules produce, and getting there is the same clicking
 * every time, so it belongs here rather than being copied per map.
 *
 * Everything is driven by what is on screen and by what the API reports, never by
 * reading the engine's phase out of the serialized state. That is the point: these
 * specs should keep working while the engine is refactored underneath them.
 */

/** Waits for the client to have actually drawn the game. */
async function waitForGamePage(page: Page): Promise<void> {
  // loginAs only waits for the navigation to commit, which for a single-page
  // client is well before there is anything on screen.
  await expect(page.locator("[data-hex-grid]")).toBeVisible({
    timeout: 30_000,
  });
}

/** Signs in as whoever the server says is to move, and opens the game. */
async function openAsActivePlayer(
  page: Page,
  users: SeededUser[],
  gameId: number,
): Promise<SeededUser> {
  const game = await fetchGame(page.request, gameId);
  const active = users.find((user) => user.id === game.activePlayerId);
  if (active == null) {
    throw new Error(
      `game ${gameId} has no active player among the seeded ones`,
    );
  }
  await loginAs(page, active, `/app/games/${gameId}`);
  await waitForGamePage(page);
  return active;
}

/** The button offered only to the player being asked to build. */
export function doneBuilding(page: Page): Locator {
  return page.getByRole("button", { name: "Done Building" });
}

/** How many builds the page says the player still has. */
export async function buildsRemaining(page: Page): Promise<number> {
  const text = await page
    .getByText(/You can build \d+ more track tile/)
    .innerText();
  const match = /You can build (\d+) more track tile/.exec(text);
  if (match == null) {
    throw new Error(`could not read builds left from "${text}"`);
  }
  return Number(match[1]);
}

/**
 * The minimal choices that move a game's opening along.
 *
 * Taking no shares and passing on turn order keeps things moving without needing
 * to understand the position. Action selection is absent on purpose: it has no
 * pass, so it is handled separately.
 */
const OPENING_CHOICES = /^(Take Shares|Skip|Pass)$/;

/**
 * Plays the opening until `stop` says the game has arrived somewhere interesting.
 *
 * Which player is to move changes as the phases go by, so this signs in as
 * whoever the server reports active. Returns that player.
 *
 * `stop` is given the page after it has rendered; a map spec passes whatever marks
 * its own position -- the build button, its own modal, a phase heading.
 */
export async function playUntil(
  page: Page,
  users: SeededUser[],
  gameId: number,
  stop: (page: Page) => Promise<boolean>,
  options: { maxSteps?: number; label?: string } = {},
): Promise<SeededUser> {
  const maxSteps = options.maxSteps ?? 24;
  // Bounded so a rule change that leaves the game waiting fails loudly here
  // instead of hanging until the whole spec times out.
  for (let step = 0; step < maxSteps; step++) {
    const before = await fetchGame(page.request, gameId);
    const active = await openAsActivePlayer(page, users, gameId);

    if (await stop(page)) return active;

    if (!(await takeAnyTurn(page))) {
      throw new Error(
        `nothing to click at step ${step} while waiting for ` +
          `${options.label ?? "the target position"}`,
      );
    }
    await waitForVersionAfter(page.request, gameId, before.version);
  }
  throw new Error(
    `never reached ${options.label ?? "the target position"} in ${maxSteps} steps`,
  );
}

/**
 * Makes the least interesting legal move available, and says whether it managed to.
 *
 * Action selection is tried first because it is the one opening phase a player
 * cannot decline.
 */
async function takeAnyTurn(page: Page): Promise<boolean> {
  const selectable = page.locator("[data-special-action][data-selectable]");
  if ((await selectable.count()) > 0) {
    await selectable.first().click();
    return true;
  }

  const choice = page.getByRole("button", { name: OPENING_CHOICES }).first();
  // Waited for as one locator: probing each label without waiting races the
  // client's first render.
  if (await isShowing(choice)) {
    await choice.click();
    return true;
  }

  const done = doneBuilding(page);
  if (await isShowing(done)) {
    await done.click();
    return true;
  }
  return false;
}

/** Whether a locator is on screen right now, without waiting for it. */
export async function isShowing(locator: Locator): Promise<boolean> {
  return locator.isVisible().catch(() => false);
}

/** Whether the game moved on, i.e. the server took an action. Short by design. */
export async function versionAdvanced(
  page: Page,
  gameId: number,
  fromVersion: number,
  withinMs = 2_000,
): Promise<boolean> {
  const deadline = Date.now() + withinMs;
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
 * A refused action raises a toast, and they stack up over whatever is beneath
 * until nothing there can be clicked.
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

/**
 * Builds the first tile the server accepts, anywhere on the board.
 *
 * The dialog offers every tile that fits the terrain, including ones the server
 * then refuses -- new track has to leave a city or extend existing track, and the
 * client does not check that -- so this tries candidates and stops when the game
 * moves on.
 */
export async function buildFirstLegalTile(
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
    for (let tile = 0, total = await tiles.count(); tile < total; tile++) {
      // force, because a rejected build leaves a toast over the dialog.
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
