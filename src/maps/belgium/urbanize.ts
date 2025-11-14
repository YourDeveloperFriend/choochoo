import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { inject, injectState } from "../../engine/framework/execution_context";
import { BAG } from "../../engine/game/state";
import { Random } from "../../engine/game/random";
import { assert } from "../../utils/validate";
import { City } from "../../engine/map/city";

export class BelgiumUrbanizeAction extends UrbanizeAction {
  private readonly bag = injectState(BAG);
  private readonly random = inject(Random);

  validate(data: UrbanizeData): void {
    const space = this.gridHelper.lookup(data.coordinates);
    assert(space instanceof City, "can only urbanize in city locations");
    const city = this.availableCities()[data.cityIndex];
    assert(city != null, `Available city doesn't exist at ${data.cityIndex}`);
  }

  process(data: UrbanizeData): boolean {
    const location = this.gridHelper.lookup(data.coordinates);
    assert(location instanceof City);

    // Put all goods growth for the removed city back into the bag
    for (const onRoll of location.onRoll()) {
      for (const good of onRoll.goods) {
        if (good !== null && good !== undefined) {
          this.bag.update((bag) => bag.push(good));
        }
      }
    }

    return super.process(data);
  }
}
