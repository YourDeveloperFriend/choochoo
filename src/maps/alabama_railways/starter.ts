import { GameStarter } from "../../engine/game/starter";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { OnRoll } from "../../engine/state/roll";
import { assert } from "../../utils/validate";

export class AlabamaRailwaysStarter extends GameStarter {
  protected startingBag(): Good[] {
    return super
      .startingBag()
      .filter((good) => good !== Good.YELLOW && good !== Good.PURPLE);
  }

  getAvailableCities(): Array<[Good | Good[], CityGroup, OnRoll]> {
    return super
      .getAvailableCities()
      .filter(([_, cityGroup]) => cityGroup === CityGroup.WHITE);
  }

  protected getGoodsGrowthGoodsFor(
    bag: Good[],
    cityColor: Good | Good[],
    urbanized: boolean,
  ): Good[] {
    const normalized = Array.isArray(cityColor) ? cityColor : [cityColor];
    const array: Good[] = [];
    for (let i = 0; i < (urbanized ? 2 : 3); i++) {
      // The bag arrives already shuffled by the seeded Random, so scan it from
      // the end for the first acceptable cube -- matching draw()'s
      // pop-from-the-end convention -- rather than sampling. This previously
      // used Math.random(), which made setup unreproducible from a seed.
      let index = -1;
      for (let candidate = bag.length - 1; candidate >= 0; candidate--) {
        const good = bag[candidate];
        if (good === Good.BLACK || !normalized.includes(good)) {
          index = candidate;
          break;
        }
      }
      assert(index >= 0, "no acceptable goods growth cube left in the bag");
      array.push(bag[index]);
      bag.splice(index, 1);
    }
    return array;
  }
}
