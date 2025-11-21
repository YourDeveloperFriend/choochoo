import { SelectAction, SelectData } from "../../engine/select_action/select";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { Action } from "../../engine/state/action";
import z from "zod";
import { CoordinatesZod } from "../../utils/coordinates";
import { Good, goodToString, GoodZod } from "../../engine/state/good";
import { BAG, injectCurrentPlayer } from "../../engine/game/state";
import { Random } from "../../engine/game/random";
import { ActionProcessor } from "../../engine/game/action";
import { GridHelper } from "../../engine/map/grid_helper";
import { assert } from "../../utils/validate";
import { City } from "../../engine/map/city";
import { SelectActionPhase } from "../../engine/select_action/phase";
import { PHASE } from "../../engine/game/phase";
import { Phase } from "../../engine/state/phase";
import { Log } from "../../engine/game/log";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { PlayerColor } from "../../engine/state/player";

const ProductionState = z.object({
  goods: GoodZod.array(),
  cities: CoordinatesZod.array(),
});
type ProductionState = z.infer<typeof ProductionState>;

export const PRODUCTION_STATE = new Key("eucProductionState", {
  parse: ProductionState.parse,
});

export class EasternUsAndCanadaSelectActionPhase extends SelectActionPhase {
  private readonly productionState = injectState(PRODUCTION_STATE);

  configureActions(): void {
    super.configureActions();
    this.installAction(ProductionAction);
  }
  onStart() {
    super.onStart();
    this.productionState.initState({ goods: [], cities: [] });
  }
  onEnd() {
    this.productionState.delete();
    super.onEnd();
  }
}

export class EasternUsAndCanadaSelectAction extends SelectAction {
  private readonly productionState = injectState(PRODUCTION_STATE);
  private readonly bag = injectState(BAG);
  private readonly random = inject(Random);

  validate(data: SelectData): void {
    super.validate(data);
    assert(this.productionState().goods.length === 0, { invalidInput: 'cannot select an action while production goods need to be placed' });
  }

  process(data: SelectData): boolean {
    const result = super.process(data);

    if (data.action === Action.PRODUCTION) {
      let pull: Good[] = [];
      this.bag.update((bag) => {
        pull = this.random.draw(2, bag, false);
      });
      if (pull.length > 0) {
        this.productionState.set({
          goods: pull,
          cities: [],
        });
        return false;
      }
    }

    return result;
  }
}

export const ProductionData = z.object({
  coordinates: CoordinatesZod,
});
export type ProductionData = z.infer<typeof ProductionData>;

export class ProductionAction implements ActionProcessor<ProductionData> {
  static readonly action = "eastern-us-and-canada-production";
  readonly assertInput = ProductionData.parse;

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly currentPhase = injectState(PHASE);
  private readonly productionState = injectState(PRODUCTION_STATE);
  private readonly gridHelper = inject(GridHelper);
  private readonly log = inject(Log);

  canEmit(): boolean {
    return (
      this.currentPhase() === Phase.ACTION_SELECTION &&
      this.currentPlayer().selectedAction === Action.PRODUCTION
    );
  }

  validate(data: ProductionData) {
    const city = this.gridHelper.lookup(data.coordinates);
    assert(city instanceof City, { invalidInput: "must place goods in city" });

    const productionState = this.productionState();
    assert(productionState.goods.length > 0, {
      invalidInput: "cannot place goods unless you take the production action",
    });
    assert(
      !productionState.cities.some((placed) => placed.equals(data.coordinates)),
      { invalidInput: "must place goods in two different cities" },
    );
  }

  process(data: ProductionData): boolean {
    const productionState = this.productionState();
    this.gridHelper.update(data.coordinates, (city) => {
      if (city.goods === undefined) {
        city.goods = [];
      }
      city.goods.push(productionState.goods[0]);
    });
    this.log.currentPlayer(
      "adds a " +
        goodToString(productionState.goods[0]) +
        " to " +
        this.gridHelper.displayName(data.coordinates),
    );

    const newState: ProductionState = {
      goods: productionState.goods.slice(1),
      cities: [...productionState.cities, data.coordinates],
    };
    this.productionState.set(newState);

    return newState.goods.length === 0;
  }
}

export class EasternUsAndCanadaGoodsGrowthPhase extends GoodsGrowthPhase {
  getPlayerOrder(): PlayerColor[] {
    return [];
  }
}
