import { inject, injectState } from "../../engine/framework/execution_context";
import { PHASE } from "../../engine/game/phase";
import { AVAILABLE_CITIES, injectCurrentPlayer } from "../../engine/game/state";
import { Log } from "../../engine/game/log";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import {
  ProductionAction,
  ProductionData,
} from "../../engine/goods_growth/production";
import { City } from "../../engine/map/city";
import { Action } from "../../engine/state/action";
import { Good } from "../../engine/state/good";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { AvailableCity } from "../../engine/state/available_city";
import { isNotNull } from "../../utils/functions";
import { assert } from "../../utils/validate";

/**
 * O'ahu's production happens immediately when the action is selected (see
 * OahuSelectAction), so the normal goods growth phase never runs.
 */
export class OahuGoodsGrowthPhase extends GoodsGrowthPhase {
  getPlayerOrder(): PlayerColor[] {
    return [];
  }

  /** No dice, so the base phase's roll at the end of the phase is a no-op. */
  getRollCount(): number {
    return 0;
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
  private readonly availableCities = injectState(AVAILABLE_CITIES);
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly currentPhase = injectState(PHASE);

  /** Only emittable right after selecting Production, while it is pending. */
  canEmit(): boolean {
    return (
      this.currentPhase() === Phase.ACTION_SELECTION &&
      this.currentPlayer().selectedAction === Action.PRODUCTION
    );
  }

  /**
   * A New City that has not yet been urbanized only exists in AVAILABLE_CITIES,
   * so a column belonging to it cannot be found on the grid. Named differently
   * from the base class's findCity since it returns a wider type.
   */
  private findColumn(data: ProductionData): City | AvailableCity | undefined {
    return super.findCity(data) ?? this.findAvailableCity(data);
  }

  private findAvailableCity(data: ProductionData): AvailableCity | undefined {
    if (!data.urbanized) return undefined;
    return this.availableCities().find((city) =>
      city.onRoll.some(
        (onRoll) =>
          onRoll.group === data.cityGroup && onRoll.onRoll === data.onRoll,
      ),
    );
  }

  /** Every city on this map has exactly one OnRollData in its onRoll array. */
  private countGoods(city: City | AvailableCity): number {
    const onRoll = city instanceof City ? city.onRoll()[0] : city.onRoll[0];
    return onRoll.goods.filter(isNotNull).length;
  }

  validate(data: ProductionData): void {
    // Deliberately does not call super, which requires a drawn good to place.
    const city = this.findColumn(data);
    assert(city != null, {
      invalidInput:
        "must choose a column belonging to a city or new city on the map",
    });
    assert(this.countGoods(city) > 0, {
      invalidInput: "must choose a column that still has cubes in it",
    });
  }

  process(data: ProductionData): boolean {
    const city = this.findColumn(data)!;
    const count = this.countGoods(city);
    if (city instanceof City) {
      this.logger.currentPlayer(`produces for ${city.name()}`);
      this.goodsHelper.moveGoodsToCity(city.coordinates, 0, count);
      return true;
    }

    this.logger.currentPlayer(
      `produces for a new city that has not been placed yet`,
    );
    const index = this.availableCities().indexOf(city);
    this.availableCities.update((cities) => {
      const availableCity = cities[index];
      const waitingArray = availableCity.onRoll[0].goods;
      for (let i = 0; i < count; i++) {
        let good: Good | undefined | null;
        do {
          good = waitingArray.pop();
        } while (good == undefined && waitingArray.length > 0);
        if (good == null) break;
        availableCity.goods.push(good);
      }
    });
    return true;
  }
}
