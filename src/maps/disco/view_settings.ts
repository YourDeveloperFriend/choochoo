import { Action } from "../../engine/state/action";
import { MapViewSettings } from "../view_settings";
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
}
