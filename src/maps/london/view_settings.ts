import { Action } from "../../engine/state/action";
import { LondonRules } from "./rules";
import { LondonMapSettings } from "./settings";
import { MapViewSettings } from "../view_settings";
import { LondonRivers } from "./rivers";
import { LondonMoveInterceptorModal } from "./move_interceptor_modal";

export class LondonViewSettings
  extends LondonMapSettings
  implements MapViewSettings
{
  getMapRules = LondonRules;
  getTexturesLayer = LondonRivers;

  getActionDescription(action: Action): string | undefined {
    if (action === Action.ENGINEER) {
      return "Negotiate with the unions for lower overtime fees.";
    }
    if (action === Action.URBANIZATION) {
      return "Add a New City to the board. Must replace an existing track segment.";
    }
    return undefined;
  }

  moveInterceptModal = LondonMoveInterceptorModal;
}
