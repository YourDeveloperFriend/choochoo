import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Random } from "../../engine/game/random";
import { BAG } from "../../engine/game/state";
import { Good, goodToString } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { assert } from "../../utils/validate";

export class ChesapeakeAndOhioUrbanizeAction extends UrbanizeAction {
  private readonly bag = injectState(BAG);
  private readonly random = inject(Random);

  process(data: UrbanizeData): boolean {
    const result = super.process(data);

    let pull: Good[];
    this.bag.update((bag) => {
      pull = this.random.draw(1, bag, false);
    });

    this.gridHelper.update(data.coordinates, (city) => {
      assert(city.type === SpaceType.CITY);
      if (city.goods === undefined) {
        city.goods = [];
      }
      for (const good of pull) {
        this.log.log(
          `A ${goodToString(good)} good is added to ${this.gridHelper.displayName(data.coordinates)} during urbanization`,
        );
        city.goods.push(good);
      }
    });

    return result;
  }
}
