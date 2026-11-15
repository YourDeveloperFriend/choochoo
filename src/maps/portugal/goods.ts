import { injectGrid } from "../../engine/game/state";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { goodToString } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { assert } from "../../utils/validate";

export class PortugalGoodsGrowthPhase extends GoodsGrowthPhase {
  private readonly grid = injectGrid();

  onEnd(): void {
    super.onEnd();
    this.addGoodToCity("Açores");
    this.addGoodToCity("Madeira");
  }

  private addGoodToCity(cityName: string) {
    const good = this.helper.drawGood();
    if (good == null) {
      return;
    }
    const city = this.grid().getCityByName(cityName);
    this.log.log(
      `A ${goodToString(good)} good is added to ${this.grid().displayName(city.coordinates)}`,
    );
    this.gridHelper.update(city.coordinates, (cityData) => {
      assert(cityData.type === SpaceType.CITY);
      cityData.goods.push(good);
    });
  }
}
