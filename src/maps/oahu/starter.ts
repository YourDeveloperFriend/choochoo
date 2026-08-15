import { draw, GameStarter } from "../../engine/game/starter";
import { Good } from "../../engine/state/good";

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
    return draw(urbanized ? 0 : 2, bag);
  }
}
