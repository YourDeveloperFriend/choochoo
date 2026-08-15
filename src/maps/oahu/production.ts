import { z } from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { PHASE } from "../../engine/game/phase";
import { AVAILABLE_CITIES, injectCurrentPlayer } from "../../engine/game/state";
import { Log } from "../../engine/game/log";
import { ActionProcessor } from "../../engine/game/action";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { City } from "../../engine/map/city";
import { GridHelper } from "../../engine/map/grid_helper";
import { Action } from "../../engine/state/action";
import { AvailableCity } from "../../engine/state/available_city";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { OnRoll, OnRollData } from "../../engine/state/roll";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
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
 * Identifies the clicked column by city group and onRoll, plus whether the
 * cubes go to that column's Starting City or its matching New City (an
 * unplaced AvailableCity, or an already-urbanized on-map City sharing the
 * same city group and onRoll).
 */
export const OahuProductionData = z.object({
  cityGroup: z.nativeEnum(CityGroup),
  onRoll: OnRoll,
  toNewCity: z.boolean(),
});

export type OahuProductionData = z.infer<typeof OahuProductionData>;

/**
 * Production runs backwards here: instead of placing a drawn good into a
 * slot of the goods display, the whole column the player clicks empties into
 * either the Starting City or the matching New City. This is a wholly
 * distinct action from the base game's Production, not an extension of it.
 */
export class OahuProductionAction
  implements ActionProcessor<OahuProductionData>
{
  static readonly action = "oahu-production";
  readonly assertInput = OahuProductionData.parse;

  private readonly logger = inject(Log);
  private readonly gridHelper = inject(GridHelper);
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

  private findOnRoll(
    onRoll: OnRollData[],
    data: OahuProductionData,
  ): OnRollData | undefined {
    return onRoll.find(
      ({ onRoll, group }) => onRoll === data.onRoll && group === data.cityGroup,
    );
  }

  /** The clicked column is always an on-map, non-urbanized Starting City. */
  private findSourceCity(data: OahuProductionData): City | undefined {
    return [...this.gridHelper.findAllCities()].find(
      (city) =>
        !city.isUrbanized() && this.findOnRoll(city.onRoll(), data) != null,
    );
  }

  /**
   * The New City this production could target may already be urbanized (an
   * on-map City) or may still be waiting in AVAILABLE_CITIES.
   */
  private findDestination(
    data: OahuProductionData,
  ): City | AvailableCity | undefined {
    if (!data.toNewCity) {
      return this.findSourceCity(data);
    }
    const urbanized = [...this.gridHelper.findAllCities()].find(
      (city) =>
        city.isUrbanized() && this.findOnRoll(city.onRoll(), data) != null,
    );
    return urbanized ?? this.findAvailableCity(data);
  }

  private findAvailableCity(
    data: OahuProductionData,
  ): AvailableCity | undefined {
    return this.availableCities().find((city) =>
      city.onRoll.some(
        (onRoll) =>
          onRoll.group === data.cityGroup && onRoll.onRoll === data.onRoll,
      ),
    );
  }

  /** Every city on this map has exactly one OnRollData in its onRoll array. */
  private countGoods(city: City): number {
    return city.onRoll()[0].goods.filter(isNotNull).length;
  }

  validate(data: OahuProductionData): void {
    const city = this.findSourceCity(data);
    assert(city != null, {
      invalidInput: "must choose a column belonging to a city on the map",
    });
    assert(this.countGoods(city) > 0, {
      invalidInput: "must choose a column that still has cubes in it",
    });
    assert(this.findDestination(data) != null, {
      invalidInput: "must choose a valid destination for the cubes",
    });
  }

  process(data: OahuProductionData): boolean {
    const source = this.findSourceCity(data)!;
    const count = this.countGoods(source);
    const destination = this.findDestination(data)!;
    const goods = this.popWaitingGoods(source, count);

    if (destination instanceof City) {
      this.logger.currentPlayer(`produces for ${destination.name()}`);
      this.gridHelper.update(destination.coordinates, (location) => {
        assert(location.type === SpaceType.CITY);
        location.goods.push(...goods);
      });
      return true;
    }

    this.logger.currentPlayer(
      `produces for a new city that has not been placed yet`,
    );
    const index = this.availableCities().indexOf(destination);
    this.availableCities.update((cities) => {
      cities[index].goods.push(...goods);
    });
    return true;
  }

  /** Empties the source city's waiting cubes, returning what was collected. */
  private popWaitingGoods(city: City, count: number): Good[] {
    const goods: Good[] = [];
    this.gridHelper.update(city.coordinates, (location) => {
      assert(location.type === SpaceType.CITY);
      const waitingArray = location.onRoll[0].goods;
      for (let i = 0; i < count; i++) {
        let good: Good | undefined | null;
        do {
          good = waitingArray.pop();
        } while (good == undefined && waitingArray.length > 0);
        if (good == null) break;
        goods.push(good);
      }
    });
    return goods;
  }
}
