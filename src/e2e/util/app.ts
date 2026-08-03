import { APIRequestContext, Page, expect } from "@playwright/test";
import { GameApi, GameStatus } from "../../api/game";

/**
 * How a spec talks to the app other than by clicking.
 *
 * Everything here goes over HTTP, using the app's own endpoints. The specs
 * deliberately do not reach into the database: the API is the surface meant to
 * hold still while internals are refactored, and Playwright's TypeScript
 * transform mishandles the decorators the models are declared with, so a DAO
 * imported into a spec silently writes nulls.
 */

export interface SeededUser {
  id: number;
  username: string;
}

/** The users a spec plays as. Created on the server; see server/test/routes. */
export async function seedUsers(
  request: APIRequestContext,
  count: number,
): Promise<SeededUser[]> {
  const response = await request.get(`/test/seed-users?count=${count}`);
  expect(
    response.ok(),
    `seeding users failed (${response.status()}); is the server in the test stage?`,
  ).toBe(true);
  const body = (await response.json()) as { users: SeededUser[] };
  return body.users;
}

/**
 * Signs the browser in as `user` and lands on `path`.
 *
 * Goes through /login-as, which sets the session directly, rather than the login
 * form -- otherwise every spec would be a test of the login form.
 */
export async function loginAs(
  page: Page,
  user: SeededUser,
  path = "/",
): Promise<void> {
  // "commit" rather than the default: this is a single-page client that keeps
  // polling, so waiting for the network to fall idle waits for a good while.
  await page.goto(`/login-as/${user.id}?redirect=${encodeURIComponent(path)}`, {
    waitUntil: "commit",
  });
}

/** Reads a game back through the API, as the client sees it. */
export async function fetchGame(
  request: APIRequestContext,
  gameId: number,
): Promise<GameApi> {
  const response = await request.get(`/api/games/${gameId}`);
  expect(response.ok(), `fetching game ${gameId} failed`).toBe(true);
  const body = (await response.json()) as { game: GameApi };
  return body.game;
}

/** Finds a game by its name, waiting for it to appear. */
export async function waitForGameNamed(
  request: APIRequestContext,
  name: string,
): Promise<GameApi> {
  let found: GameApi | undefined;
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `/api/games?name=${encodeURIComponent(name)}&pageSize=20`,
        );
        if (!response.ok()) return false;
        const body = (await response.json()) as { games: GameApi[] };
        found = body.games.find((game) => game.name === name);
        return found != null;
      },
      { timeout: 30_000, message: `no game named "${name}" appeared` },
    )
    .toBe(true);
  return found!;
}

/** Waits for a game to reach `status`. */
export async function waitForStatus(
  request: APIRequestContext,
  gameId: number,
  status: GameStatus,
): Promise<GameApi> {
  await expect
    .poll(async () => (await fetchGame(request, gameId)).status, {
      timeout: 30_000,
      message: `game ${gameId} never became ${status}`,
    })
    .toBe(status);
  return fetchGame(request, gameId);
}

/**
 * Deletes a game a spec created.
 *
 * Non-GET requests carry an XSRF token, which the client fetches per session and
 * the server checks on everything else.
 */
export async function deleteGame(
  request: APIRequestContext,
  gameId: number,
): Promise<void> {
  const tokenResponse = await request.get("/api/xsrf");
  const { xsrfToken } = (await tokenResponse.json()) as { xsrfToken: string };
  await request.delete(`/test/games/${gameId}`, {
    headers: { "xsrf-token": xsrfToken },
  });
}

/** The XSRF token for this context's session, which every non-GET needs. */
async function xsrfToken(request: APIRequestContext): Promise<string> {
  const response = await request.get("/api/xsrf");
  const body = (await response.json()) as { xsrfToken: string };
  return body.xsrfToken;
}

async function post(
  request: APIRequestContext,
  path: string,
  data: unknown,
): Promise<Response> {
  const response = await request.post(path, {
    data,
    headers: { "xsrf-token": await xsrfToken(request) },
  });
  expect(
    response.ok(),
    `POST ${path} failed (${response.status()}): ${await response.text()}`,
  ).toBe(true);
  return response as unknown as Response;
}

/**
 * Creates a two-player game and starts it on a fixed seed.
 *
 * Built through the API rather than the UI on purpose: the create-game flow has
 * its own spec, and repeating it here would mean a change to that form breaking
 * two specs for one reason.
 *
 * Auto-start is off so the seed can be supplied explicitly, which keeps the board
 * the same from run to run.
 */
export async function createStartedGame(
  page: Page,
  users: SeededUser[],
  options: { gameKey: string; name: string; seed: string },
): Promise<GameApi> {
  const api = page.request;
  const [owner, ...others] = users;

  await loginAs(page, owner);
  await post(api, "/api/games/", {
    gameKey: options.gameKey,
    name: options.name,
    minPlayers: users.length,
    maxPlayers: users.length,
    variant: {},
    turnDuration: 24 * 60 * 60 * 1000,
    gameHoursStart: 0,
    gameHoursDuration: 24,
    minKarma: 0,
    artificialStart: false,
    unlisted: true,
    autoStart: false,
  });

  const game = await waitForGameNamed(api, options.name);

  for (const other of others) {
    await loginAs(page, other);
    await post(api, `/api/games/${game.id}/join`, {});
  }

  await loginAs(page, owner);
  await post(api, `/api/games/${game.id}/start`, { seed: options.seed });

  return waitForStatus(api, game.id, GameStatus.enum.ACTIVE);
}

/** Waits for the game's version to move past `version`, i.e. for an action to land. */
export async function waitForVersionAfter(
  request: APIRequestContext,
  gameId: number,
  version: number,
): Promise<GameApi> {
  await expect
    .poll(async () => (await fetchGame(request, gameId)).version, {
      timeout: 30_000,
      message: `game ${gameId} never advanced past version ${version}`,
    })
    .toBeGreaterThan(version);
  return fetchGame(request, gameId);
}
