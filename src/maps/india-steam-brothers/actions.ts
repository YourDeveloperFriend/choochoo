import { Action, ActionNamingProvider } from "../../engine/state/action";

export class IndiaSteamBrothersActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.PRODUCTION) {
      return "During the Goods Growth step, select a city, draw 2 goods, then place one of those goods in the selected city.";
    }
    return super.getActionDescription(action);
  }
}
