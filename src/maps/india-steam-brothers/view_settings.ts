import { Action } from "../../engine/state/action";
import { IndiaSteamBrothersRules } from "./rules";
import { IndiaSteamBrothersMapSettings } from "./settings";
import { MapViewSettings } from "../view_settings";
import { IndiaSteamBrothersRivers } from "./rivers";

export class IndiaSteamBrothersViewSettings
  extends IndiaSteamBrothersMapSettings
  implements MapViewSettings
{
  getMapRules = IndiaSteamBrothersRules;
  getTexturesLayer = IndiaSteamBrothersRivers;

  getActionDescription(action: Action): string | undefined {
    if (action === Action.PRODUCTION) {
      return "During the Goods Growth step, select a city, draw 2 goods, then place one of those goods in the selected city.";
    }
    return undefined;
  }
}
