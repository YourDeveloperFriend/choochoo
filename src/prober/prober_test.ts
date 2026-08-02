import { By } from "selenium-webdriver";
import { describe, it } from "vitest";
import { setUpWebDriver } from "../testing/webdriver";
import { loginBypass } from "../server/util/environment";

describe("prober test", () => {
  const driver = setUpWebDriver(
    "https://www.choochoo.games",
    "https://api.choochoo.games",
  );

  it("site is live", async () => {
    await driver.goHome(loginBypass().loginIds[0]);

    await driver.waitForElement(By.xpath("//*[@data-game-card]"));
  });
});
