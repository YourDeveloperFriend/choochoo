import {UrbanizeAction, UrbanizeData} from "../../engine/build/urbanize";
import {inject, injectState} from "../../engine/framework/execution_context";
import {BAG} from "../../engine/game/state";
import {Random} from "../../engine/game/random";
import {assert} from "../../utils/validate";
import {City} from "../../engine/map/city";
import {Good} from "../../engine/state/good";

export class MinasGeraesUrbanizeAction extends UrbanizeAction {
  private readonly bag = injectState(BAG);
  private readonly random = inject(Random);

  validate(data: UrbanizeData): void {
    const space = this.gridHelper.lookup(data.coordinates);
    assert(space !== undefined, {
      invalidInput: "Invalid space for urbanization"
    });

    const city = this.availableCities()[data.cityIndex];
    if (city.color === Good.BLACK) {
      // FIXME: Assert the location is a mining town
    } else if (city.color === Good.YELLOW) {
      assert(space instanceof City, {
        invalidInput: "When urbanizing the yellow city, it must go on top of a non-black, non-yellow city."
      });
      const cityColors = space.goodColors();
      assert(cityColors.length >0 && !cityColors.some(color => color === Good.BLACK || color === Good.YELLOW), {
        invalidInput: "When urbanizing the yellow city, it must go on top of a non-black, non-yellow city."
      });
    } else {
      // FIXME: Assert the location is a regular town
    }
  }

  process(data: UrbanizeData): boolean {
    const result = super.process(data);

    const location = this.gridHelper.lookup(data.coordinates);
    assert(location instanceof City);
    if (location.goodColors().some(color => color === Good.BLACK)) {
      const bag = [...this.bag()];
      const yellowIndex = bag.indexOf(Good.YELLOW);
      if (yellowIndex >= 0) {
        bag.splice(yellowIndex, 1);
        this.bag.set(bag);
        this.gridHelper.update(location.coordinates, loc => {
          if (!loc.goods) {
            loc.goods = [];
          }
          loc.goods.push(Good.YELLOW);
        });
      }
    }

    return result;
  }
}
