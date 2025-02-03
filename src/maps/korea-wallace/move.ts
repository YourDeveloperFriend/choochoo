import { City } from "../../engine/map/city";
import { MoveHelper } from "../../engine/move/helper";
import { Good } from "../../engine/state/good";

export class KoreaWallaceMoveHelper extends MoveHelper {
  canDeliverTo(city: City, good: Good): boolean {
    return city.getGoods().includes(good);
  }
}
