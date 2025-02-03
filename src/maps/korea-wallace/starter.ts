import { GameStarter } from "../../engine/game/starter";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { OnRoll } from "../../engine/state/roll";

export class KoreaWallaceStarter extends GameStarter {
  getAvailableCities(): Array<[Good | Good[], CityGroup, OnRoll]> {
    return [
      [[], CityGroup.WHITE, 3],
      [[], CityGroup.WHITE, 4],
      [[], CityGroup.WHITE, 5],
      [[], CityGroup.WHITE, 6],
      [[], CityGroup.BLACK, 1],
      [[], CityGroup.BLACK, 2],
      [[], CityGroup.BLACK, 3],
      [[], CityGroup.BLACK, 4],
    ];
  }
}
