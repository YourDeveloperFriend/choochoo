import { inject } from "../../engine/framework/execution_context";
import { RoundEngine } from "../../engine/game/round";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { City } from "../../engine/map/city";
import { GridHelper } from "../../engine/map/grid_helper";
import { MoveHelper } from "../../engine/move/helper";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { Coordinates } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { Side } from "./state";

export class MoonRoundEngine extends RoundEngine {
  private readonly gridHelper = inject(GridHelper);

  start(round: number) {
    super.start(round);
    this.moveDayToNight(round);
  }

  moveDayToNight(round: number): void {
    const lookFor = round % 2 === 1 ? Side.LEFT : Side.RIGHT;
    for (const city of this.gridHelper.findAllCities()) {
      if (city.goodColors().length === 0) continue;
      this.gridHelper.update(city.coordinates, (city) => {
        assert(city.type === SpaceType.CITY);
        const originalColor = Array.isArray(city.color)
          ? city.color.find((c) => c !== Good.BLACK)!
          : city.color;
        if (city.mapSpecific!.side === lookFor) {
          city.color = [originalColor, Good.BLACK];
        } else {
          city.color = [originalColor];
        }
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
  getRollCount(_: CityGroup): number {
    return this.playerCount() * 2;
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
