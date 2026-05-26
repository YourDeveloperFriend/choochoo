import { MapViewSettings } from "../view_settings";
import { VermontRules } from "./rules";
import { VermontMapSettings } from "./settings";
import { Action } from "../../engine/state/action";
import { useInjectedState } from "../../client/utils/injection_context";
import { ActionMoney } from "./action_selection";
import { VermontRivers } from "./rivers";

export class VermontViewSettings
  extends VermontMapSettings
  implements MapViewSettings
{
  getMapRules = VermontRules;
  getTexturesLayer = VermontRivers;

  getActionCaption(action: Action): string[] | string | undefined {
    const actionCost = useInjectedState(ActionMoney).get(action);
    if (actionCost === undefined || actionCost === 0) {
      return undefined;
    }
    return "$" + actionCost;
  }
}
