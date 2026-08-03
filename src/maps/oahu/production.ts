import { inject } from "../../engine/framework/execution_context";
import { Log } from "../../engine/game/log";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import {
  ProductionAction,
  ProductionData,
} from "../../engine/goods_growth/production";
import { City } from "../../engine/map/city";
import { Good } from "../../engine/state/good";
import { PlayerColor } from "../../engine/state/player";
import { OnRollData } from "../../engine/state/roll";
import { isNotNull } from "../../utils/functions";
import { assert } from "../../utils/validate";

/** The columns of a city's goods display that still have cubes in them. */
function producibleColumns(
  city: City,
): Array<{ onRollIndex: number; onRollData: OnRollData; goods: Good[] }> {
  return city.onRoll().flatMap((onRollData, onRollIndex) => {
    const goods = onRollData.goods.filter(isNotNull);
    return goods.length === 0 ? [] : [{ onRollIndex, onRollData, goods }];
  });
}

/**
 * O'ahu keeps the normal goods growth phase, but nothing grows: no dice are
 * rolled and no cubes are drawn. The phase exists purely so the production
 * player can empty one column of the goods display into its city.
 */
export class OahuGoodsGrowthPhase extends GoodsGrowthPhase {
  configureActions(): void {
    // Deliberately does not call super: production is replaced by picking a
    // whole column, and there is no passing on a mandatory action.
    this.installAction(OahuProductionAction);
  }

  /**
   * Deliberately does not call super, which draws two cubes from the bag and
   * keeps GOODS_GROWTH_STATE for them. Nothing is drawn and nothing reads that
   * state here, because OahuProduction replaces the base production summary.
   */
  onStartTurn(): void {}

  onEndTurn(): void {}

  /** No dice, so the base phase's roll at the end of the phase is a no-op. */
  getRollCount(): number {
    return 0;
  }

  getPlayerOrder(): PlayerColor[] {
    const productionPlayer = this.productionPlayer();
    if (productionPlayer == null) {
      return [];
    }
    const hasColumns = [...this.gridHelper.findAllCities()].some(
      (city) => producibleColumns(city).length > 0,
    );
    if (!hasColumns) {
      this.log.player(
        productionPlayer,
        "has to forfeit production because the goods display is empty",
      );
      return [];
    }
    return [productionPlayer.color];
  }
}

/**
 * The good is a required part of the base action's data, but production runs
 * backwards here: nothing is drawn, so there is no good to place. The action
 * ignores it, and the summary sends this so the shape still parses.
 */
export const IGNORED_GOOD = Good.BLACK;

/**
 * Production runs backwards here: instead of placing a drawn good into a slot of
 * the goods display, the whole column the player clicks empties into its city.
 * Extending the base action keeps the action name and data shape, so the goods
 * table can drive it. The good and the row it identifies are ignored; only the
 * column matters.
 */
export class OahuProductionAction extends ProductionAction {
  private readonly logger = inject(Log);
  private readonly goodsHelper = inject(GoodsHelper);

  private countGoods(data: ProductionData): number {
    const city = this.findCity(data);
    if (city == null) return 0;
    return (
      producibleColumns(city).find(
        ({ onRollData }) =>
          onRollData.group === data.cityGroup &&
          onRollData.onRoll === data.onRoll,
      )?.goods.length ?? 0
    );
  }

  private findOnRollIndex(city: City, data: ProductionData): number {
    return city
      .onRoll()
      .findIndex(
        ({ group, onRoll }) =>
          group === data.cityGroup && onRoll === data.onRoll,
      );
  }

  validate(data: ProductionData): void {
    // Deliberately does not call super, which requires a drawn good to place.
    assert(this.findCity(data) != null, {
      invalidInput: "must choose a column belonging to a city on the map",
    });
    assert(this.countGoods(data) > 0, {
      invalidInput: "must choose a column that still has cubes in it",
    });
  }

  process(data: ProductionData): boolean {
    const city = this.findCity(data)!;
    this.logger.currentPlayer(`produces for ${city.name()}`);
    this.goodsHelper.moveGoodsToCity(
      city.coordinates,
      this.findOnRollIndex(city, data),
      this.countGoods(data),
    );
    return true;
  }
}
