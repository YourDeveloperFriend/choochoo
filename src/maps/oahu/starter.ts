import { draw, GameStarter } from "../../engine/game/starter";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { SpaceData } from "../../engine/state/space";
import { assert } from "../../utils/validate";

/**
 * Only on-map (Starting City) columns ever hold waiting cubes now, so New
 * City columns start empty rather than pre-loaded.
 */
export class OahuGameStarter extends GameStarter {
  protected getGoodsGrowthGoodsFor(
    bag: Good[],
    cityColor: Good | Good[],
    urbanized: boolean,
  ): Array<undefined | Good> {
    if (urbanized) return [];
    const [first] = draw(1, bag);
    const index = bag.findIndex((good) => good !== first);
    assert(index >= 0, "starting bag ran out of distinct colors!");
    const [second] = bag.splice(index, 1);
    return [first, second];
  }

  protected drawCubesFor(
    bag: Good[],
    location: SpaceData,
    playerCount: number,
  ): SpaceData {
    if (location.type !== SpaceType.CITY && location.townName != null) {
      return {
        ...location,
        goods: draw(1, bag),
      };
    }
    return super.drawCubesFor(bag, location, playerCount);
  }
}
