import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { Good } from "../../engine/state/good";
import { CityGroup, cityGroupToString } from "../../engine/state/city_group";

export class ChicagoSpeakeasyGoodsGrowthPhase extends GoodsGrowthPhase {
  onEnd(): void {
    super.onEnd();

    const cities = this.gridHelper.findAllCities();
    for (const cityGroup of [CityGroup.WHITE, CityGroup.BLACK]) {
      const dieRoll = this.random.rollDie();
      this.log.log(
        `${cityGroupToString(cityGroup)} rolled ${dieRoll} for an additional black cube.`,
      );
      for (const city of cities) {
        for (const [_, { group, onRoll }] of city.onRoll().entries()) {
          if (group !== cityGroup) continue;
          if (onRoll !== dieRoll) continue;
          this.gridHelper.update(city.coordinates, (location) => {
            if (location.goods === undefined) {
              location.goods = [];
            }
            location.goods.push(Good.BLACK);
          });
        }
      }
    }
  }
}
