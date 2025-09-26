import { MoveHelper } from "../../engine/move/helper";
import { City } from "../../engine/map/city";
import { Good } from "../../engine/state/good";
import { PlayerData } from "../../engine/state/player";
import { MoveData } from "../../engine/move/move";
import { injectState } from "../../engine/framework/execution_context";
import { UNION_PACIFIC_EXPRESS_MOVE_STATE } from "./deliver";
import { UnionPacificExpressMapData } from "./grid";

export class UnionPacificExpressMoveHelper extends MoveHelper {
  private readonly unionPacificExpressMoveState = injectState(
    UNION_PACIFIC_EXPRESS_MOVE_STATE,
  );

  canDeliverTo(city: City, good: Good): boolean {
    const mapSpecific = city.getMapSpecific(UnionPacificExpressMapData.parse);
    if (mapSpecific && mapSpecific.transferStation) {
      return true;
    }
    return super.canDeliverTo(city, good);
  }

  canMoveThrough(city: City, good: Good): boolean {
    const mapSpecific = city.getMapSpecific(UnionPacificExpressMapData.parse);
    if (mapSpecific && mapSpecific.transferStation) {
      return true;
    }
    return super.canMoveThrough(city, good);
  }

  isWithinLocomotive(player: PlayerData, moveData: MoveData): boolean {
    return (
      moveData.path.length +
        this.unionPacificExpressMoveState().usedLinks.length <=
      player.locomotive
    );
  }
}
