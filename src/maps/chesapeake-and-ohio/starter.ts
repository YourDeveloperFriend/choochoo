import { GameStarter } from "../../engine/game/starter";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { SpaceData } from "../../engine/state/space";

export class ChesapeakeAndOhioStarter extends GameStarter {
  isProductionEnabled(): boolean {
    return false;
  }

  protected drawCubesFor(
    bag: Good[],
    location: SpaceData,
    playerCount: number,
  ): SpaceData {
    if (location.type !== SpaceType.CITY && location.townName != null) {
      return {
        ...location,
        goods: [bag.pop()!],
      };
    }
    return super.drawCubesFor(bag, location, playerCount);
  }
}
