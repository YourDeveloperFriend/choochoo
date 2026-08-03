import { expect, test } from "@playwright/test";
import { GameStatus } from "../api/game";
import {
  deleteGame,
  fetchGame,
  loginAs,
  seedUsers,
  waitForGameNamed,
  waitForStatus,
} from "./util/app";

/**
 * Creating a game, from the lobby through to a started game.
 *
 * Jamaica seats exactly two, so the game fills -- and, with auto-start on by
 * default, begins -- after a single join. A larger map would add joins without
 * adding coverage.
 *
 * What this asserts is that the clicks reached the server: a game row with the
 * chosen map and name, then that same game active with both players in it. The
 * board it dealt is not checked. That is decided entirely by the engine, which
 * the recorded playthroughs cover far more thoroughly than a browser can.
 */

const GAME_KEY = "jamaica";

let created: number[] = [];

test.afterEach(async ({ request }) => {
  // Otherwise games pile up in a shared database and crowd the home page a later
  // spec looks at.
  for (const gameId of created) await deleteGame(request, gameId);
  created = [];
});

test("creates a game and starts it once it is full", async ({ page }) => {
  // page.request, not the standalone request fixture: only the page's context
  // carries the session cookie that /login-as set, so a call made through the
  // other one is unauthenticated.
  const api = page.request;
  const [owner, joiner] = await seedUsers(api, 2);
  // Named per run, so the lookup finds this game rather than a leftover.
  const name = `e2e ${Date.now()}`.slice(0, 32);

  await loginAs(page, owner, "/app/games/create");

  await page.fill('input[name="name"]', name);

  await page.click("[data-change-map-button]");
  await expect(page.locator("[data-map-selector-dialog]")).toBeVisible();
  await page.click(`[data-map-row="${GAME_KEY}"] [data-map-select-button]`);
  // The dialog closing is what shows the selection registered.
  await expect(page.locator("[data-map-selector-dialog]")).toBeHidden();

  await page.click("[data-create-button]");

  const game = await waitForGameNamed(api, name);
  created.push(game.id);
  expect(game.gameKey).toBe(GAME_KEY);
  expect(game.status).toBe(GameStatus.enum.LOBBY);
  expect(game.playerIds).toEqual([owner.id]);

  // Joining fills the game, and auto-start is on, so the server should start it
  // without anyone pressing start.
  await loginAs(page, joiner, `/app/games/${game.id}`);
  await page.click("[data-join-button]");

  const started = await waitForStatus(api, game.id, GameStatus.enum.ACTIVE);
  expect(started.playerIds).toHaveLength(2);
  expect(started.playerIds).toContain(joiner.id);
  // A started game has an engine state and somebody to move. One that failed to
  // start would have neither.
  expect(started.activePlayerId).toBeTruthy();

  const reread = await fetchGame(api, game.id);
  expect(reread.status).toBe(GameStatus.enum.ACTIVE);
});
