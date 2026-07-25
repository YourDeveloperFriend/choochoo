import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { CityGroup } from "../../engine/state/city_group";

export class BarbadosGoodsGrowthPhase extends GoodsGrowthPhase {
  getRollCount(group: CityGroup): number {
    if (group === CityGroup.BLACK) {
      return 0;
    }
    return 2;
  }
}
