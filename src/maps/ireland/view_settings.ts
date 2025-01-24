import {Action} from "../../engine/state/action";
import {IrelandRules} from "./rules";
import {IrelandMapSettings} from "./settings";
import {MapViewSettings} from "../view_settings";
import {IrelandRivers} from "./rivers";


export class IrelandViewSettings extends IrelandMapSettings implements MapViewSettings {
  getMapRules = IrelandRules;
  getTexturesLayer = IrelandRivers;

  getActionDescription(action: Action): string | undefined {
    if (action === Action.LOCOMOTIVE) {
      return 'Temporarily increase your locomotive by one for the round. Does not increase your expenses.';
    }
    return undefined;
  }
}