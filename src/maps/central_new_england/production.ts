import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import z from "zod";
import { goodToString } from "../../engine/state/good";
import { CoordinatesZod } from "../../utils/coordinates";
import { ActionProcessor } from "../../engine/game/action";
import { injectCurrentPlayer } from "../../engine/game/state";
import { inject, injectState } from "../../engine/framework/execution_context";
import { PHASE } from "../../engine/game/phase";
import { GridHelper } from "../../engine/map/grid_helper";
import { Log } from "../../engine/game/log";
import { Phase } from "../../engine/state/phase";
import { Action } from "../../engine/state/action";
import { assert } from "../../utils/validate";
import { City } from "../../engine/map/city";
import { GOODS_GROWTH_STATE } from "../../engine/goods_growth/state";

export class CentralNewEnglandGoodsGrowthPhase extends GoodsGrowthPhase {
  configureActions() {
    this.installAction(CentralNewEnglandProductionAction);
  }
}

export const ProductionData = z.object({
  coordinates: CoordinatesZod,
});
export type ProductionData = z.infer<typeof ProductionData>;

export class CentralNewEnglandProductionAction
  implements ActionProcessor<ProductionData>
{
  static readonly action = "central-new-england-production";
  readonly assertInput = ProductionData.parse;

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly currentPhase = injectState(PHASE);
  private readonly goodsGrowthState = injectState(GOODS_GROWTH_STATE);
  private readonly gridHelper = inject(GridHelper);
  private readonly log = inject(Log);

  canEmit(): boolean {
    return (
      this.currentPhase() === Phase.GOODS_GROWTH &&
      this.currentPlayer().selectedAction === Action.PRODUCTION
    );
  }

  validate(data: ProductionData) {
    const city = this.gridHelper.lookup(data.coordinates);
    assert(city instanceof City, { invalidInput: "must place goods in city" });

    const productionState = this.goodsGrowthState();
    assert(productionState.goods.length > 0, {
      invalidInput: "cannot place goods unless you take the production action",
    });
  }

  process(data: ProductionData): boolean {
    this.gridHelper.update(data.coordinates, (city) => {
      if (city.goods === undefined) {
        city.goods = [];
      }
      for (const good of this.goodsGrowthState().goods) {
        city.goods.push(good);
        this.log.currentPlayer(
          "adds a " +
            goodToString(good) +
            " to " +
            this.gridHelper.displayName(data.coordinates),
        );
      }
    });
    this.goodsGrowthState.set({ goods: [] });
    return true;
  }
}
