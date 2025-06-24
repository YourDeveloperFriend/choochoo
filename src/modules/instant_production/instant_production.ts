import z from "zod";
import { Coordinates, CoordinatesZod } from "../../utils/coordinates";
import { ActionProcessor } from "../../engine/game/action";
import { inject, injectState } from "../../engine/framework/execution_context";
import { GridHelper } from "../../engine/map/grid_helper";
import { Log } from "../../engine/game/log";
import { assert } from "../../utils/validate";
import { Good, goodToString } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { OnRollData } from "../../engine/state/roll";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { Key } from "../../engine/framework/key";

const InstantProductionState = z.object({
  startCity: CoordinatesZod.optional(),
  endCity: CoordinatesZod.optional(),
  drawnCube: z.nativeEnum(Good).optional(),
});
type InstantProductionState = z.infer<typeof InstantProductionState>;

export const INSTANT_PRODUCTION_STATE = new Key("instantProductionState", {
  parse: InstantProductionState.parse,
});

export const InstantProductionData = z.object({
  city: CoordinatesZod,
});
export type InstantProductionData = z.infer<typeof InstantProductionData>;

export class InstantProductionAction
  implements ActionProcessor<InstantProductionData>
{
  static action = "instant-production";
  private readonly instantProductionState = injectState(
    INSTANT_PRODUCTION_STATE,
  );
  private readonly gridHelper = inject(GridHelper);
  private readonly goodsHelper = inject(GoodsHelper);
  private readonly log = inject(Log);

  assertInput = InstantProductionData.parse;

  canEmit(): boolean {
    const state = this.instantProductionState();
    return state.startCity !== undefined && state.endCity !== undefined;
  }

  validate(data: InstantProductionData): void {
    const state = this.instantProductionState();
    assert(state.startCity !== undefined);
    assert(state.endCity !== undefined);
    assert(
      data.city.equals(state.startCity) || data.city.equals(state.endCity),
      {
        invalidInput:
          "Must choose either the starting city or ending city of the delivery.",
      },
    );
  }
  process(data: InstantProductionData): boolean {
    const state = this.instantProductionState();

    if (state.drawnCube !== undefined) {
      const drawnCube: Good = state.drawnCube;
      this.gridHelper.update(data.city, (loc) => {
        this.log.log(
          `A ${goodToString(drawnCube)} good is added to the Goods Growth for ${this.gridHelper.displayName(data.city)}`,
        );
        assert(loc.type === SpaceType.CITY);
        const onRoll: OnRollData[] = loc.onRoll;
        assert(onRoll.length === 1);
        onRoll[0].goods.push(state.drawnCube);
      });
    } else {
      applyInstantProduction(
        this.gridHelper,
        this.goodsHelper,
        this.log,
        data.city,
      );
    }
    return true;
  }
}

export function applyInstantProduction(
  gridHelper: GridHelper,
  goodsHelper: GoodsHelper,
  log: Log,
  coordinates: Coordinates,
) {
  gridHelper.update(coordinates, (loc) => {
    assert(loc.type === SpaceType.CITY);
    const onRoll: OnRollData[] = loc.onRoll;
    assert(onRoll.length === 1);

    let newGood: Good | undefined | null;
    do {
      newGood = onRoll[0].goods.pop();
    } while (newGood == undefined && onRoll[0].goods.length > 0);

    if (newGood != null) {
      log.log(
        `A ${goodToString(newGood)} good is added to ${gridHelper.displayName(coordinates)}`,
      );
      loc.goods.push(newGood);
    } else {
      const pull = goodsHelper.drawGood();
      log.log(
        `A ${goodToString(pull)} good is added to the Goods Growth for ${gridHelper.displayName(coordinates)}`,
      );
      onRoll[0].goods.push(pull);
    }
  });
}
