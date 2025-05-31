import { Action } from "../../engine/state/action";
import { MapViewSettings } from "../view_settings";
import { ScotlandRules } from "./rules";
import { ScotlandRivers } from "./rivers";
import { ScotlandMapSettings } from "./settings";

export class ScotlandViewSettings
  extends ScotlandMapSettings
  implements MapViewSettings
{
  getMapRules = ScotlandRules;
  getTexturesLayer = ScotlandRivers;

  getActionDescription(action: Action): string | undefined {
    if (action === Action.TURN_ORDER_PASS) {
      return "Become first player in the next round skipping auction phase.";
    }
    return undefined;
  }
}
