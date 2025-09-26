import { GameStarter } from "../../engine/game/starter";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { SpaceData } from "../../engine/state/space";

export class UnionPacificExpressStarter extends GameStarter {
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

    if (
      playerCount >= 4 &&
      location.type === SpaceType.CITY &&
      (location.name === "Cheyenne" || location.name === "Omaha")
    ) {
      return {
        ...location,
        goods: [bag.pop()!],
      };
    }

    return super.drawCubesFor(bag, location, playerCount);
  }
}
