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

  /** In 4 and 5 player games, each New City tile carries a cube that joins the city once it is urbanized. */
  protected numCubesForAvailableCity(): number {
    return this.players().length >= 4 ? 1 : 0;
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
