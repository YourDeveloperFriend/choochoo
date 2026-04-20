import { draw, GameStarter } from "../../engine/game/starter";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { OnRoll } from "../../engine/state/roll";
import { assert } from "../../utils/validate";
import { isSacramento, NorthernCaliforniaMapData } from "./grid";

const SHIP_QUEUE_SIZE = 10;

export class NorthernCaliforniaStarter extends GameStarter {
  protected onStartGame(): void {
    super.onStartGame();

    const bag = [...this.bag()];

    let queue: Good[] | undefined;
    for (const city of this.gridHelper.findAllCities()) {
      const mapSpecific = city.getMapSpecific(NorthernCaliforniaMapData.parse);
      if (mapSpecific && mapSpecific.shipQueue !== undefined) {
        queue = draw(SHIP_QUEUE_SIZE, bag);
        this.gridHelper.update(city.coordinates, (loc) => {
          (loc.mapSpecific as NorthernCaliforniaMapData).shipQueue = queue;
        });
        break;
      }
    }

    assert(queue !== undefined);
    this.bag.set(bag);
    const head = queue[0];
    assert(head != null, "ship queue must be non-empty at game start");
    for (const city of this.gridHelper.findAllCities()) {
      if (isSacramento(city.data)) {
        this.gridHelper.update(city.coordinates, (loc) => {
          assert(loc.type === SpaceType.CITY);
          loc.color = [head];
        });
        return;
      }
    }
  }

  getAvailableCities(): Array<[Good | Good[], CityGroup, OnRoll]> {
    return super
      .getAvailableCities()
      .filter(([color, _, __]) => color !== Good.RED);
  }
}
