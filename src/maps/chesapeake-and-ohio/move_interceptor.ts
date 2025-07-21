import { MoveData } from "../../engine/move/move";
import { MoveInterceptor } from "../../engine/move/interceptor";
import { injectGrid } from "../../engine/game/state";
import { ChesapeakeAndOhioMapData } from "./build";

export class ChesapeakeAndOhioMoveInterceptor extends MoveInterceptor {
  private readonly grid = injectGrid();

  public shouldInterceptMove(moveData: MoveData, _cityName: string): boolean {
    // Intercept if there is a factory at the destination
    const destination = this.grid().get(
      moveData.path[moveData.path.length - 1].endingStop,
    );
    if (destination === undefined) {
      return false;
    }
    const mapData = destination.getMapSpecific(ChesapeakeAndOhioMapData.parse);
    if (mapData && mapData.factoryColor !== undefined) {
      return true;
    }
    return false;
  }
}
