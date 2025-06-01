import { MoveData } from "../../engine/move/move";
import { MoveInterceptor } from "../../engine/move/interceptor";
import { injectGrid } from "../../engine/game/state";
import { City } from "../../engine/map/city";

export class LondonMoveInterceptor extends MoveInterceptor {
  private readonly grid = injectGrid();

  public shouldInterceptMove(moveData: MoveData, _cityName: string): boolean {
    // The starting hex might be a town. Intercept the move if there is a choice about where to do instant production.
    const start = this.grid().get(moveData.startingCity);
    return start instanceof City;
  }
}
