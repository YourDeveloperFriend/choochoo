import { REVERSTEAM_GAME_KEY } from "../maps/reversteam/settings";
import { Direction, SimpleTileType, TownTileType } from "../engine/state/tile";
import { Coordinates } from "../utils/coordinates";
import { compareGameData, setUpGameEnvironment } from "./util/game_data";
import { Driver } from "./util/webdriver";

export function buildingTrack(driver: Driver) {
  const env = setUpGameEnvironment(
    { gameKey: REVERSTEAM_GAME_KEY, baseRules: true },
    "build_track_before",
  );

  it("builds track", async () => {
    await driver.goToGame(env.game.id, env.activePlayer.id);

    await driver.buildTrack(
      Coordinates.from({ q: 9, r: 13 }),
      SimpleTileType.CURVE,
      Direction.BOTTOM,
    );

    await driver.buildTrack(
      Coordinates.from({ q: 10, r: 12 }),
      TownTileType.K,
      Direction.BOTTOM_RIGHT,
    );

    await new Promise((r) => setTimeout(r, 1000));

    await compareGameData(env.game, "build_track_after");
  });
}
