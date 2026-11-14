import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { inject, injectState } from "../../engine/framework/execution_context";
import { ROUND, RoundEngine } from "../../engine/game/round";
import { injectGrid } from "../../engine/game/state";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { City } from "../../engine/map/city";
import { GridHelper } from "../../engine/map/grid_helper";
import { MoveHelper } from "../../engine/move/helper";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { MutableCityData } from "../../engine/state/space";
import { allDirections } from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { MoonMapData, Side } from "./state";
import { OnRollData } from "../../engine/state/roll";

function getNightSide(round: number): Side {
  return round % 2 === 1 ? Side.LEFT : Side.RIGHT;
}

function addNightColor(city: MutableCityData, lookFor: Side): void {
  const originalColor = Array.isArray(city.color)
    ? city.color.find((c) => c !== Good.BLACK)!
    : city.color;
  if (city.mapSpecific!.side === lookFor) {
    city.color = [originalColor, Good.BLACK];
  } else {
    city.color = [originalColor];
  }
}

export class MoonRoundEngine extends RoundEngine {
  private readonly gridHelper = inject(GridHelper);

  start(round: number) {
    super.start(round);
    this.moveDayToNight(round);
  }

  moveDayToNight(round: number): void {
    const lookFor = getNightSide(round);
    for (const city of this.gridHelper.findAllCities()) {
      if (city.goodColors().length === 0) continue;
      this.gridHelper.update(city.coordinates, (city) => {
        assert(city.type === SpaceType.CITY);
        addNightColor(city, lookFor);
      });
    }
  }
}

export class MoonMoveHelper extends MoveHelper {
  canDeliverTo(city: City, good: Good): boolean {
    const colors = city.goodColors().includes(Good.BLACK)
      ? [Good.BLACK]
      : city.goodColors();
    return colors.includes(good);
  }
}

export class MoonGoodsGrowthPhase extends GoodsGrowthPhase {
  private readonly round = injectState(ROUND);
  private readonly actualGrid = injectGrid();

  // Dice are rolled once, attributed to the chart group of the day side, and
  // applied to all day cities regardless of their chart group.
  getRollCount(group: CityGroup): number {
    return group === this.dayGroup() ? this.playerCount() * 2 : 0;
  }

  private dayGroup(): CityGroup {
    return getNightSide(this.round()) === Side.LEFT
      ? CityGroup.BLACK
      : CityGroup.WHITE;
  }

  rollAppliesTo(_: CityGroup, city: City, __: OnRollData): boolean {
    if (
      city.getMapSpecific(MoonMapData.parse)!.side ===
      getNightSide(this.round())
    ) {
      return false;
    }
    const connected = allDirections.some(
      (direction) =>
        this.actualGrid().getTrackConnection(city.coordinates, direction) !=
        null,
    );
    return connected;
  }
}

export class MoonGoodsHelper extends GoodsHelper {
  moveGoodsToCity(
    coordinates: Coordinates,
    onRollIndex: number,
    count: number,
  ): void {
    const city = this.grid.lookup(coordinates);
    assert(city instanceof City);
    if (city.goodColors().includes(Good.BLACK)) return;
    return super.moveGoodsToCity(coordinates, onRollIndex, count);
  }
}

export class MoonUrbanizeAction extends UrbanizeAction {
  private readonly round = injectState(ROUND);

  process(data: UrbanizeData): boolean {
    const result = super.process(data);
    this.gridHelper.update(data.coordinates, (location) => {
      addNightColor(location as MutableCityData, getNightSide(this.round()));
    });
    return result;
  }
}
