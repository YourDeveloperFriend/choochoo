import { expect, test } from "@playwright/test";
import { createStartedGame, deleteGame, seedUsers } from "../../e2e/util/app";

let gameId: number | undefined;
test.afterEach(async ({ request }) => {
  if (gameId != null) {
    await deleteGame(request, gameId);
    gameId = undefined;
  }
});

test("keeps bee goods inside stable square growth slots at mobile and desktop widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const users = await seedUsers(page.request, 3);
  const game = await createStartedGame(page, users, {
    gameKey: "honeybee-hive-mind",
    name: `e2e bee sizing ${Date.now()}`,
    seed: "e2e-bee-sizing",
  });
  gameId = game.id;
  await page.goto(`/app/games/${game.id}`);
  const table = page
    .getByRole("heading", { name: "Goods Growth Table" })
    .locator("..");
  const container = table.locator(":scope > div");
  const bee = table.locator("svg").first();
  await expect(bee).toBeVisible();

  for (const width of [390, 320, 768, 1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    // A cyclic intrinsic-size calculation grows on successive layout frames.
    const samples = await container.evaluate(async (element) => {
      const samples = [];
      for (let frame = 0; frame < 30; frame++) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        samples.push({
          width: element.getBoundingClientRect().width,
          scrollWidth: element.scrollWidth,
        });
      }
      return samples;
    });
    for (const sample of samples) {
      expect(sample.width).toBeLessThanOrEqual(500);
      expect(sample.scrollWidth).toBeLessThanOrEqual(
        Math.ceil(sample.width) + 1,
      );
    }
    expect(
      Math.max(...samples.map((s) => s.width)) -
        Math.min(...samples.map((s) => s.width)),
    ).toBeLessThan(1);
    const bounds = await bee.evaluate((svg) => {
      const icon = svg.getBoundingClientRect();
      const slot = svg.parentElement!.getBoundingClientRect();
      return {
        iconWidth: icon.width,
        iconHeight: icon.height,
        slotWidth: slot.width,
        slotHeight: slot.height,
      };
    });
    expect(bounds.iconWidth).toBeGreaterThan(0);
    expect(bounds.iconWidth).toBeLessThanOrEqual(bounds.slotWidth);
    expect(bounds.iconHeight).toBeLessThanOrEqual(bounds.slotHeight);
    expect(Math.abs(bounds.slotWidth - bounds.slotHeight)).toBeLessThan(1);
  }
});
