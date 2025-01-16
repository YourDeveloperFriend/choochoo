import {City} from "../../engine/map/city";
import {MoveHelper} from "../../engine/move/helper";
import {Good} from "../../engine/state/good";
import {PORT_CITIES} from "./port_cities";

export class GermanyMoveHelper extends MoveHelper {
  canMoveThrough(city: City, good: Good): boolean {
    // Cubes are never allowed to move through the port cities
    for (let portCoordinates of PORT_CITIES) {
      if (portCoordinates.equals(city.coordinates)) {
        return false;
      }
    }

    return super.canMoveThrough(city, good);
  }
}
