import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { CityGroup } from "../../engine/state/city_group";

export class WyomingGoodsGrowthPhase extends GoodsGrowthPhase {
  getRollCount(_: CityGroup): number {
    return this.playerCount() * 2;
  }
}
