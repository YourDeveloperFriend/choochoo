import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { Action } from "../../engine/state/action";
import z from "zod";
import { CoordinatesZod } from "../../utils/coordinates";
import { goodToString, GoodZod } from "../../engine/state/good";
import { injectCurrentPlayer } from "../../engine/game/state";
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
import { ActionBundle } from "../../engine/game/phase_module";

const ProductionState = z.object({
  goods: GoodZod.array(),
});
type ProductionState = z.infer<typeof ProductionState>;

export const PRODUCTION_STATE = new Key("dbuProductionState", {
  parse: ProductionState.parse,
});

export class DoubleBaseUsaSelectActionPhase extends SelectActionPhase {
  private readonly productionState = injectState(PRODUCTION_STATE);
  private readonly currentPlayer = injectCurrentPlayer();

  configureActions(): void {
    super.configureActions();
    this.installAction(ProductionAction);
  }
  onStart() {
    super.onStart();
    this.productionState.initState({ goods: [] });
  }
  onEnd() {
    this.productionState.delete();
    super.onEnd();
  }
  forcedAction(): ActionBundle<object> | undefined {
    // If the current player has already selected an action (i.e. production) do not force an action
    if (this.currentPlayer().selectedAction !== undefined) {
      return undefined;
    }
    return super.forcedAction();
  }
}

export const ProductionData = z.object({
  good: GoodZod,
  coordinates: CoordinatesZod,
});
export type ProductionData = z.infer<typeof ProductionData>;

export class ProductionAction implements ActionProcessor<ProductionData> {
  static readonly action = "double-base-usa-production";
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
    assert(city.onRoll().length === 0, {
      invalidInput: "good must be placed on a non-numbered city",
    });

    const productionState = this.productionState();
    assert(productionState.goods.length > 0, {
      invalidInput: "cannot place goods unless you take the production action",
    });
    assert(productionState.goods.indexOf(data.good) !== -1, {
      invalidInput: "must select a good that was drawn",
    });
  }

  process(data: ProductionData): boolean {
    this.gridHelper.update(data.coordinates, (city) => {
      if (city.goods === undefined) {
        city.goods = [];
      }
      city.goods.push(data.good);
    });
    this.log.currentPlayer(
      "adds a " +
        goodToString(data.good) +
        " to " +
        this.gridHelper.displayName(data.coordinates),
    );
    this.productionState.set({ goods: [] });
    return true;
  }
}

export class DoubleBaseUsaGoodsGrowthPhase extends GoodsGrowthPhase {
  getPlayerOrder(): PlayerColor[] {
    return [];
  }
}
