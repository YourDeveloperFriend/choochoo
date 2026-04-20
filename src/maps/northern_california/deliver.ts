import { inject } from "../../engine/framework/execution_context";
import { Log } from "../../engine/game/log";
import { City } from "../../engine/map/city";
import { MoveAction, MoveData } from "../../engine/move/move";
import { goodToString } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { Coordinates } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { isSacramento, NorthernCaliforniaMapData } from "./grid";

export class NorthernCaliforniaMoveAction extends MoveAction {
  private readonly logger = inject(Log);

  process(action: MoveData): boolean {
    const result = super.process(action);

    const startingCity = this.grid().get(action.startingCity);
    if (startingCity == null || !(startingCity instanceof City)) {
      return result;
    }
    // Check if the starting city is Santa Cruz
    const startingCityMapData = startingCity.getMapSpecific(
      NorthernCaliforniaMapData.parse,
    );
    if (!startingCityMapData || startingCityMapData.shipQueue === undefined) {
      return result;
    }

    // If Santa Cruz is not empty yet
    if (startingCity.getGoods().length > 0) {
      return result;
    }

    const queue = startingCityMapData.shipQueue;
    const sacramentoCoords = this.findSacramentoCoords();
    if (queue.length === 0) {
      if (sacramentoCoords !== undefined) {
        this.gridHelper.update(sacramentoCoords, (loc) => {
          assert(loc.type === SpaceType.CITY);
          if (!(loc.color instanceof Array) || loc.color.length !== 0) {
            this.logger.log(
              "The shipping queue is empty, so Sacramento becomes colorless",
            );
            loc.color = [];
          }
        });
      }
      return result;
    }

    const head = queue[0];
    const newQueue = queue.slice(1);
    this.gridHelper.update(startingCity.coordinates, (loc) => {
      assert(loc.type === SpaceType.CITY);
      (loc.mapSpecific as NorthernCaliforniaMapData).shipQueue = newQueue;
    });

    this.gridHelper.update(action.startingCity, (loc) => {
      assert(loc.type === SpaceType.CITY);
      loc.goods.push(head);
    });

    if (sacramentoCoords !== undefined) {
      this.gridHelper.update(sacramentoCoords, (loc) => {
        assert(loc.type === SpaceType.CITY);
        loc.color = [head];
      });
    }

    this.logger.log(
      `A ${goodToString(head)} ship cube arrives at Santa Cruz from the shipping queue, and demand in Sacramento becomes ${goodToString(head)}`,
    );

    return result;
  }

  private findSacramentoCoords(): Coordinates | undefined {
    for (const city of this.gridHelper.findAllCities()) {
      if (isSacramento(city.data)) return city.coordinates;
    }
    return undefined;
  }
}
