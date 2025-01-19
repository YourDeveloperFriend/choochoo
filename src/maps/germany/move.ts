import {City} from "../../engine/map/city";
import {MoveHelper} from "../../engine/move/helper";
import {Good} from "../../engine/state/good";
import {GermanyMapData} from "./grid";

export class GermanyMoveHelper extends MoveHelper {
  canMoveThrough(city: City, good: Good): boolean {
    const mapData = city.getMapSpecific(GermanyMapData.parse);
    if (mapData && mapData.portCity) {
      return false;
    }

    return super.canMoveThrough(city, good);
  }
}
