import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { SpaceType } from "../../engine/state/location_type";
import { isNotNull } from "../../utils/functions";
import { assert } from "../../utils/validate";

export class RustBeltExpressUrbanizeAction extends UrbanizeAction {
  process(data: UrbanizeData): boolean {
    const result = super.process(data);

    this.gridHelper.update(data.coordinates, (city) => {
      assert(city.type === SpaceType.CITY);
      if (!city.goods) {
        city.goods = [];
      }
      city.goods = city.goods.concat(city.onRoll[0].goods.filter(isNotNull));
      city.onRoll[0].goods = [];
    });

    return result;
  }
}
