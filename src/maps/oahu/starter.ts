import { draw, GameStarter } from "../../engine/game/starter";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { SpaceData } from "../../engine/state/space";

export class OahuStarter extends GameStarter {
  protected drawCubesFor(
    bag: Good[],
    location: SpaceData,
    playerCount: number,
  ): SpaceData {
    // Every town starts with one cube on it.
    if (location.type !== SpaceType.CITY && location.townName != null) {
      return { ...location, goods: draw(1, bag) };
    }
    return super.drawCubesFor(bag, location, playerCount);
  }

  /**
   * New city tiles start with a cube sitting on top of them, which comes out as
   * soon as the tile is urbanized onto the map.
   */
  protected numCubesForAvailableCity(): number {
    return 1;
  }

  protected getGoodsGrowthGoodsFor(
    bag: Good[],
    cityColor: Good | Good[],
    urbanized: boolean,
  ): Array<Good | undefined> {
    // The new cities portion of the goods display is left empty during setup.
    if (urbanized) return [];
    return super.getGoodsGrowthGoodsFor(bag, cityColor, urbanized);
  }
}
