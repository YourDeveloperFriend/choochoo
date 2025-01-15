import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { CityGroup } from "../../engine/state/city_group";

export class DetroitGoodsGrowthPhase extends GoodsGrowthPhase {
  getRollCount(_: CityGroup): number {
    const playerCount = this.playerCount();
    return playerCount === 1 ? 2 : playerCount;
  }
}