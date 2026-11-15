import { GameStarter } from "../../engine/game/starter";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { allGoods, Good } from "../../engine/state/good";
import { CityData } from "../../engine/state/space";

export const HEAVY_CARDBOARD_SAME_CITY = 1;

export class HeavyCardboardStarter extends GameStarter {
  protected getPlacedGoodsFor(
    bag: Good[],
    playerCount: number,
    location: CityData,
  ): Good[] {
    if (!isHeavyCardboardCity(location)) {
      return super.getPlacedGoodsFor(bag, playerCount, location);
    }
    for (const good of allGoods) {
      bag.splice(bag.indexOf(good), 1);
    }
    return [...allGoods];
  }
}

export class HeavyCardboardGoodsGrowth extends GoodsGrowthPhase {
  onStart(): void {
    super.onStart();
    const heavyCardboard = [...this.gridHelper.findAllCities()].find((city) =>
      isHeavyCardboardCity(city.data),
    )!;
    if (heavyCardboard.getGoods().length !== 0) {
      return;
    }

    this.gridHelper.update(heavyCardboard.coordinates, (cityData) => {
      const goods = [...allGoods].filter((good) => this.bag().includes(good));
      cityData.goods = goods;
    });
    this.bag.update((bag) => {
      for (const good of allGoods) {
        const index = bag.indexOf(good);
        if (index >= 0) {
          bag.splice(index, 1);
        }
      }
    });
  }
}

function isHeavyCardboardCity(city: CityData): boolean {
  return (
    city.sameCity === HEAVY_CARDBOARD_SAME_CITY &&
    city.mapSpecific?.center === true
  );
}
