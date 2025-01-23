import { Action } from "../../engine/state/action";
import { IndiaRules } from "./rules";
import { IndiaMapSettings } from "./settings";

export class IndiaViewSettings extends IndiaMapSettings {
  getMapRules = IndiaRules;

  getActionDescription(action: Action): string | undefined {
    if (action === Action.PRODUCTION) {
      return 'During the Goods Growth step, select a city, draw 2 goods, then place one of those goods in the selected city.';
    }
    return undefined;
  }
}