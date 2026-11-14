import { expect, test } from "@playwright/test";
import {
  createStartedGame,
  deleteGame,
  fetchGame,
  seedUsers,
  waitForVersionAfter,
} from "../../e2e/util/app";
import { applyScript, openAsActivePlayer } from "../../e2e/util/play";

let gameId: number | undefined;
test.afterEach(async ({ request }) => {
  if (gameId != null) {
    await deleteGame(request, gameId);
    gameId = undefined;
  }
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`stages, undoes and confirms a Waggle move (${reducedMotion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    const users = await seedUsers(page.request, 3);
    const game = await createStartedGame(page, users, {
      gameKey: "honeybee-hive-mind",
      name: `e2e honeybee ${Date.now()}`,
      seed: "e2e-honeybee-waggle",
    });
    gameId = game.id;
    await applyScript(page, users, game.id, [
      ...Array.from({ length: 3 }, () => ({
        actionName: "takeShares",
        actionData: { numShares: 3 },
      })),
      ...Array.from({ length: 2 }, () => ({
        actionName: "pass",
        actionData: {},
      })),
      ...[32, 33, 5].map((action) => ({
        actionName: "select",
        actionData: { action },
      })),
      ...Array.from({ length: 3 }, () => ({
        actionName: "done",
        actionData: {},
      })),
    ]);
    await openAsActivePlayer(page, users, game.id);
    const controls = page.getByLabel("Waggle Dance map controls");
    await expect(controls).toBeVisible();
    const goodsTable = page
      .getByRole("heading", { name: "Goods Growth Table" })
      .locator("..");
    await expect(
      goodsTable
        .getByRole("img", { name: "Bee swarm (yellow good)", exact: true })
        .first(),
    ).toBeVisible();
    const bees = page.getByRole("button", {
      name: "Select a movable bee swarm",
      exact: true,
    });
    await expect(bees.first()).toBeVisible();
    const originalBees = await page
      .locator(
        '[data-hex-grid] [role="img"][aria-label="Bee swarm (yellow good)"]',
      )
      .count();
    // Selecting the same swarm cancels; Undo also clears an unplaced selection.
    await bees.first().click();
    await expect(controls).toContainText("Choose a highlighted destination");
    await bees.first().click();
    await expect(controls).toContainText("Click a bee on the map");
    await bees.first().click();
    await controls.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(controls).toContainText("0/3 selected");

    const stageMove = async () => {
      await bees.first().click();
      // The hub starts with no swarm, so it cannot be the selected source.
      await page
        .locator('[data-hex-grid] polygon[data-coordinates="6|6"]')
        .last()
        .click();
      await expect(controls).toContainText("1/3 selected");
    };
    await stageMove();
    await expect
      .poll(() =>
        page
          .locator(
            '[data-hex-grid] [role="img"][aria-label="Bee swarm (yellow good)"]',
          )
          .count(),
      )
      .toBe(originalBees);
    await controls.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(controls).toContainText("0/3 selected");
    await stageMove();

    const before = await fetchGame(page.request, game.id);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let submissions = 0;
    await page.route(`**/api/games/${game.id}/action`, async (route) => {
      submissions++;
      await gate;
      await route.continue();
    });
    try {
      await controls
        .getByRole("button", { name: "Confirm Waggle Dance", exact: true })
        .click();
      await expect(
        controls.getByRole("button", {
          name: "Confirm Waggle Dance",
          exact: true,
        }),
      ).toBeDisabled();
      await expect(
        controls.getByRole("button", { name: "Undo", exact: true }),
      ).toBeDisabled();
      await expect(
        controls.getByRole("button", {
          name: "Decline Waggle Dance",
          exact: true,
        }),
      ).toBeDisabled();
      await expect(bees).toHaveCount(0);
      expect(submissions).toBe(1);
    } finally {
      release();
    }
    await waitForVersionAfter(page.request, game.id, before.version);
    await expect(controls).not.toBeVisible();
    await page.reload();
    await expect(
      page.getByLabel("Waggle Dance map controls"),
    ).not.toBeVisible();
    expect(submissions).toBe(1);
  });
}
