import { buildingTrack } from "./build_track_test";
import { creatingGame } from "./create_game_test";
import { movingGoods } from "./move_good_test";
import { setUpServer } from "./util/server";
import { setTestTimeout } from "./util/timeout";
import { Driver, setUpWebDriver } from "./util/webdriver";

type DescribeCb = (driver: Driver) => void;

const tests: Array<[string, DescribeCb]> = [];

export function describeE2e(name: string, cb: DescribeCb) {
  tests.push([name, cb]);
}

describe("e2e tests", () => {
  const driver = setUpWebDriver("http://localhost:3001");
  setTestTimeout(60000);
  setUpServer();

  describe("Building track", () => buildingTrack(driver));
  describe("creating game", () => creatingGame(driver));
  describe("moving goods", () => movingGoods(driver));
});
