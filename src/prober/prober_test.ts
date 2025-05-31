import { By } from "selenium-webdriver";
import { setUpWebDriver } from "../e2e/util/webdriver";
import { environment } from "../server/util/environment";

describe("prober test", () => {
  const driver = setUpWebDriver("https://www.choochoo.games");

  it("site is live", async () => {
    await driver.goHome(environment.loginIds[0]);

    await driver.waitForElement(By.xpath("//*[@data-game-card]"));
  });
});
