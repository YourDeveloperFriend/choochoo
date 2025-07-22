import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import {
  ActionProcessor,
  EmptyActionProcessor,
} from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { BAG, injectGrid, injectPlayerAction } from "../../engine/game/state";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { GOODS_GROWTH_STATE } from "../../engine/goods_growth/state";
import { GridHelper } from "../../engine/map/grid_helper";
import { Land } from "../../engine/map/location";
import { Action } from "../../engine/state/action";
import { BLACK, goodToString } from "../../engine/state/good";
import { PlayerColor } from "../../engine/state/player";
import { CoordinatesZod } from "../../utils/coordinates";
import { assert } from "../../utils/validate";

export class PolandGoodsGrowthPhase extends GoodsGrowthPhase {
  protected readonly log = inject(Log);
  protected readonly gridHelper = inject(GridHelper);
  protected readonly helper = inject(GoodsHelper);
  protected readonly goodsGrowthState = injectState(GOODS_GROWTH_STATE);
  protected readonly bag = injectState(BAG);
  protected readonly productionPlayer = injectPlayerAction(Action.PRODUCTION);
  private readonly grid = injectGrid();

  configureActions(): void {
    this.installAction(PolandProductionAction);
    this.installAction(ProductionPassAction);
  }

  onStartTurn(): void {
    const goods = this.helper.drawGoods(1);
    const asColors = goods.map(goodToString);
    this.log.currentPlayer(`draws ${asColors.join(", ")}`);
    this.goodsGrowthState.initState({ goods });
  }

  getPlayerOrder(): PlayerColor[] {
    const productionPlayer = this.productionPlayer();
    if (productionPlayer == null) {
      return [];
    }

    return [productionPlayer.color];
  }

  onEnd(): void {
    let blackInBag = -1;

    this.bag.update((bag) => {
      blackInBag = bag.indexOf(BLACK);

      if (blackInBag !== -1) {
        bag.splice(blackInBag, 1);
      }
    });

    if (blackInBag !== -1) {
      const warsaw = this.grid().getCityByName("Warsaw");
      this.helper.addGoodToCity(warsaw.coordinates, BLACK);
    }

    super.onEnd();
  }
}

export const ProductionData = z.object({
  coordinates: CoordinatesZod,
});

export type ProductionData = z.infer<typeof ProductionData>;

export class PolandProductionAction implements ActionProcessor<ProductionData> {
  static readonly action = "poland-production";
  readonly assertInput = ProductionData.parse;

  protected readonly goodsGrowthState = injectState(GOODS_GROWTH_STATE);
  private readonly gridHelper = inject(GridHelper);

  validate(data: ProductionData) {
    const space = this.gridHelper.lookup(data.coordinates);

    assert(space instanceof Land && space.hasTown(), {
      invalidInput: "must place goods in town",
    });
  }

  process(data: ProductionData): boolean {
    this.gridHelper.update(data.coordinates, (town) => {
      town.goods = town.goods
        ? town.goods!.concat(this.goodsGrowthState().goods)
        : this.goodsGrowthState().goods;
    });
    return true;
  }
}

export class ProductionPassAction extends EmptyActionProcessor {
  static readonly action = "poland-production-pass";

  protected readonly goodsGrowthState = injectState(GOODS_GROWTH_STATE);
  private readonly bag = injectState(BAG);

  validate() {}

  process(): boolean {
    this.bag.update((bag) => bag.push(...this.goodsGrowthState().goods));
    return true;
  }
}
