import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import {
  ActionProcessor,
  EmptyActionProcessor,
} from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { PhaseEngine } from "../../engine/game/phase";
import { PhaseModule } from "../../engine/game/phase_module";
import { Random } from "../../engine/game/random";
import { BAG, injectPlayerAction } from "../../engine/game/state";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { GOODS_GROWTH_STATE } from "../../engine/goods_growth/state";
import { City } from "../../engine/map/city";
import { GridHelper } from "../../engine/map/grid_helper";
import { Action } from "../../engine/state/action";
import { goodToString } from "../../engine/state/good";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { CoordinatesZod } from "../../utils/coordinates";
import { insertBefore } from "../../utils/functions";
import { assert } from "../../utils/validate";

export class DiscoPhaseEngine extends PhaseEngine {
  phaseOrder(): Phase[] {
    return insertBefore(
      super.phaseOrder(),
      Phase.GOODS_GROWTH,
      Phase.DISCO_INFERNO_PRODUCTION,
    ).filter((phase) => phase !== Phase.GOODS_GROWTH);
  }
}

export class DiscoProductionPhase extends PhaseModule {
  static readonly phase = Phase.DISCO_INFERNO_PRODUCTION;

  protected readonly log = inject(Log);
  protected readonly productionPlayer = injectPlayerAction(Action.PRODUCTION);
  protected readonly bag = injectState(BAG);
  protected readonly goodsGrowthState = injectState(GOODS_GROWTH_STATE);
  protected readonly helper = inject(GoodsHelper);
  protected readonly random = inject(Random);

  configureActions(): void {
    this.installAction(ProductionAction);
    this.installAction(ProductionPassAction);
  }

  onStartTurn(): void {
    super.onStartTurn();
    const goods = this.helper.drawGoods(2);
    const asColors = goods.map(goodToString);
    this.log.currentPlayer(`draws ${asColors.join(", ")}`);
    this.goodsGrowthState.initState({ goods });
  }

  onEndTurn(): void {
    if (this.goodsGrowthState().goods.length > 0) {
      this.bag.update((bag) => bag.push(...this.goodsGrowthState().goods));
    }
    this.goodsGrowthState.delete();
    super.onEndTurn();
  }

  getPlayerOrder(): PlayerColor[] {
    const productionPlayer = this.productionPlayer();
    if (productionPlayer == null) {
      return [];
    }
    return [productionPlayer.color];
  }
}

export const ProductionData = z.object({
  coordinates: CoordinatesZod,
});
export type ProductionData = z.infer<typeof ProductionData>;

export class ProductionAction implements ActionProcessor<ProductionData> {
  static readonly action = "disco-production";
  readonly assertInput = ProductionData.parse;

  protected readonly goodsGrowthState = injectState(GOODS_GROWTH_STATE);
  private readonly gridHelper = inject(GridHelper);

  validate(data: ProductionData) {
    const city = this.gridHelper.lookup(data.coordinates);
    assert(city instanceof City, { invalidInput: "must place goods in city" });
    assert(city.goodColors().length > 0, {
      invalidInput: "cannot place goods in burnt city",
    });
  }

  process(data: ProductionData): boolean {
    this.gridHelper.update(data.coordinates, (city) => {
      city.goods = this.goodsGrowthState().goods;
    });
    return true;
  }
}

export class ProductionPassAction extends EmptyActionProcessor {
  static readonly action = "disco-production-pass";
  readonly assertInput = ProductionData.parse;

  protected readonly goodsGrowthState = injectState(GOODS_GROWTH_STATE);
  private readonly bag = injectState(BAG);

  validate() {}

  process(): boolean {
    this.bag.update((bag) => bag.push(...this.goodsGrowthState().goods));
    return true;
  }
}
