import { Coordinates } from "../../utils/coordinates";
import { iterate } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { Random } from "../game/random";
import { BAG } from "../game/state";
import { City } from "../map/city";
import { GridHelper } from "../map/grid_helper";
import { Good, goodToString } from "../state/good";
import { SpaceType } from "../state/location_type";
import { Log } from "../game/log";

export class GoodsHelper {
  protected readonly bag = injectState(BAG);
  protected readonly random = inject(Random);
  protected readonly grid = inject(GridHelper);
  protected readonly log = inject(Log);

  getTotalUpcomingGoodsSlots(urbanized: boolean) {
    return urbanized ? 2 : 3;
  }

  isAtCapacity(city: City): boolean {
    return city
      .onRoll()
      .every(
        ({ goods }) =>
          goods.length >= this.getTotalUpcomingGoodsSlots(city.isUrbanized()),
      );
  }

  hasCityOpenings(): boolean {
    for (const city of this.grid.findAllCities()) {
      if (!this.isAtCapacity(city)) {
        return true;
      }
    }
    return false;
  }

  moveGoodsToCity(
    coordinates: Coordinates,
    onRollIndex: number,
    count: number,
  ): void {
    if (count === 0) return;

    this.grid.update(coordinates, (location) => {
      assert(location.type === SpaceType.CITY);
      const newGoods: Good[] = [];
      const waitingArray = location.onRoll[onRollIndex].goods;
      for (let i = 0; i < count; i++) {
        let newGood: Good | undefined | null;
        do {
          newGood = waitingArray.pop();
        } while (newGood == undefined && waitingArray.length > 0);
        if (newGood == null) {
          break;
        }
        newGoods.push(newGood);
      }
      for (const good of newGoods) {
        this.log.log(
          `A ${goodToString(good)} good is added to ${this.grid.displayName(coordinates)}`,
        );
        location.goods.push(good);
      }
    });
  }

  drawGood(): Good {
    const [good] = this.drawGoods(1);
    return good;
  }

  drawGoods(count: number): Good[] {
    const goods: Good[] = [];
    this.bag.update((bag) => {
      iterate(count, () => {
        if (bag.length === 0) return;
        const index = this.random.random(bag.length);
        goods.push(...bag.splice(index, 1));
      });
    });
    return goods;
  }
}
