import { creatingGame } from "./create_game_test";
import { setUpServer } from "./util/server";
import { setTestTimeout } from "./util/timeout";
import { Driver, setUpWebDriver } from "./util/webdriver";

type DescribeCb = (driver: Driver) => void;

const tests: Array<[string, DescribeCb]> = [];

export function describeE2e(name: string, cb: DescribeCb) {
  tests.push([name, cb]);
}

describe("e2e tests", () => {
  const driver = setUpWebDriver("https://www.choochoo.games");
  setTestTimeout(60000);
  setUpServer();

  // describe("Building track", () => buildingTrack(driver));
  describe("creating game", () => creatingGame(driver));

  describe("foo", () => {
    it("foos", async () => {
      await driver.goHome();
      expect(1 + 1).toBe(2);
    });
  });
});
