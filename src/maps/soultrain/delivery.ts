import z from "zod";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { City } from "../../engine/map/city";
import { MoveHelper } from "../../engine/move/helper";
import { MoveAction, MoveData } from "../../engine/move/move";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { peek } from "../../utils/functions";
import { assert } from "../../utils/validate";
import {
  Dimension,
  dimensionToString,
  DimensionZod,
  SoulTrainMapData,
} from "./map_data";

export const DeliveryRestriction = z.object({
  from: DimensionZod,
  to: DimensionZod,
});
export type DeliveryRestriction = z.infer<typeof DeliveryRestriction>;

export const DELIVERY_RESTRICTION = new Key("deliveryRestriction", {
  parse: DeliveryRestriction.parse,
});

export class SoulTrainMoveHelper extends MoveHelper {
  private readonly restriction = injectState(DELIVERY_RESTRICTION);

  canDeliverTo(city: City, good: Good): boolean {
    return (
      city.accepts(good) &&
      city.getMapSpecific(SoulTrainMapData.parse)?.dimension ===
        this.restriction().to
    );
  }

  canMoveThrough(city: City, good: Good): boolean {
    return !city.accepts(good);
  }
}

export class SoulTrainMoveAction extends MoveAction {
  private readonly restriction = injectState(DELIVERY_RESTRICTION);

  validate(action: MoveData) {
    super.validate(action);

    assert(
      this.grid()
        .get(action.startingCity)!
        .getMapSpecific(SoulTrainMapData.parse)!.dimension ===
        this.restriction().from,
      {
        invalidInput: `must deliver from ${dimensionToString(this.restriction().from)}`,
      },
    );
  }
  process(action: MoveData): boolean {
    const result = super.process(action);
    if (this.restriction().to !== Dimension.HEAVEN) {
      this.gridHelper.update(peek(action.path).endingStop, (city) => {
        assert(city.type === SpaceType.CITY);
        city.goods.push(action.good);
      });
    }
    return result;
  }
}
