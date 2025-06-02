import { GameStarter } from "../../engine/game/starter";
import { Good } from "../../engine/state/good";
import { SpaceData } from "../../engine/state/space";
import { SpaceType } from "../../engine/state/location_type";

export class LondonStarter extends GameStarter {
  protected drawCubesFor(
    bag: Good[],
    location: SpaceData,
    playerCount: number,
  ): SpaceData {
    if (
      location.type !== SpaceType.CITY &&
      location.townName &&
      ["Fulham", "St. John's Wood", "Brixton", "Deptford"].indexOf(
        location.townName,
      ) !== -1
    ) {
      return {
        ...location,
        goods: [bag.pop()!],
      };
    }
    return super.drawCubesFor(bag, location, playerCount);
  }
}
