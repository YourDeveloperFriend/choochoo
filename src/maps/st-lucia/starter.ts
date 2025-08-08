import { GameStarter } from "../../engine/game/starter";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { SpaceData } from "../../engine/state/space";

export class StLuciaStarter extends GameStarter {
  isGoodsGrowthEnabled(): boolean {
    return false;
  }

  protected drawCubesFor(bag: Good[], location: SpaceData): SpaceData {
    if (
      location.type === SpaceType.CITY ||
      location.townName != null ||
      location.type === SpaceType.MOUNTAIN
    ) {
      return location;
    }
    return {
      ...location,
      goods: [bag.pop()!],
    };
  }
}
