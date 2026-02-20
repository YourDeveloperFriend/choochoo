import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { inject } from "../../engine/framework/execution_context";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { goodToString } from "../../engine/state/good";
import { CityGroup } from "../../engine/state/city_group";

export class EasternUsAndCanadaGoodsGrowth extends GoodsGrowthPhase {
  protected readonly helper = inject(GoodsHelper);

  onStart(): void {
    super.onStart();
    const pittsburgh = [...this.gridHelper.findAllCities()].find(
      (city) => city.data.name === "Pittsburgh",
    )!;
    const newGood = this.helper.drawGood();
    this.gridHelper.update(pittsburgh.coordinates, (cityData) => {
      if (cityData.goods === undefined) {
        cityData.goods = [];
      }
      cityData.goods.push(newGood);
    });
    this.log.log(`A ${goodToString(newGood)} good is added to Pittsburgh`);
  }

  getRollCount(_: CityGroup): number {
    return 0;
  }
}
