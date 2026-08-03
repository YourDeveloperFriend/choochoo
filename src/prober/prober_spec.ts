import { expect, test } from "@playwright/test";
import { loginBypass } from "../server/util/environment";

/**
 * Checks that production is up. Runs on a schedule; see workflows/probe.yml.
 *
 * Unlike the end-to-end specs, this drives the real site, so it only ever reads.
 * Signing in uses the login bypass, which production allows for a listed user id
 * with the matching key -- so LOGIN_IDS and LOGIN_KEY have to be set for this to
 * do anything.
 */
test("the site is live and shows games", async ({ page, baseURL }) => {
  const { loginIds, loginKey } = loginBypass();
  expect(
    loginIds.length > 0 && (loginKey?.length ?? 0) > 0,
    "the prober needs LOGIN_IDS and LOGIN_KEY to sign in",
  ).toBe(true);

  // The API is on its own host in production, and the login bypass is served by
  // the API rather than by the static site.
  const apiOrigin =
    process.env.PROBER_API_ORIGIN ?? "https://api.choochoo.games";
  const redirect = `${baseURL}/`;
  await page.goto(
    `${apiOrigin}/login-as/${loginIds[0]}` +
      `?loginKey=${encodeURIComponent(loginKey!)}` +
      `&redirect=${encodeURIComponent(redirect)}`,
  );

  // A game card means the client loaded, called the API, got games back, and
  // rendered them -- which is the whole point of the check.
  await expect(page.locator("[data-game-card]").first()).toBeVisible({
    timeout: 30_000,
  });
});
