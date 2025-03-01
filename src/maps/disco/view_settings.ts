import { useGrid, useInjected } from "../../client/utils/injection_context";
import { Action } from "../../engine/state/action";
import { MapViewSettings } from "../view_settings";
import { DiscoMoveHelper } from "./deliver";
import { DiscoInfernoRules } from "./rules";
import { DiscoInfernoMapSettings } from "./settings";

export class DiscoInfernoViewSettings
  extends DiscoInfernoMapSettings
  implements MapViewSettings
{
  getMapRules = DiscoInfernoRules;

  getActionDescription(action: Action): string | undefined {
    if (action === Action.PRODUCTION) {
      return "Draw two cubes and place them in one city after the move goods step.";
    }
    return undefined;
  }

  moveGoodsMessage(): string | undefined {
    const helper = useInjected(DiscoMoveHelper);
    const grid = useGrid();

    const lastStop = helper.lastStop();
    if (lastStop == null) return undefined;

    const lastStopName = grid.get(lastStop)!.name();
    const movesRemaining = helper.movesRemaining();

    const tag =
      movesRemaining === 1
        ? "1 move remaining"
        : `${movesRemaining} moves remaining`;
    return `You must continue the chain reaction from ${lastStopName} (${tag})`;
  }
}
