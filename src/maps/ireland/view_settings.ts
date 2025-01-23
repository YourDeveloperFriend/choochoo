import { Action } from "../../engine/state/action";
import { IrelandRules } from "./rules";
import { IrelandMapSettings } from "./settings";


export class IrelandViewSettings extends IrelandMapSettings {
  getMapRules = IrelandRules;

  getActionDescription(action: Action): string | undefined {
    if (action === Action.LOCOMOTIVE) {
      return 'Temporarily increase your locomotive by one for the round. Does not increase your expenses.';
    }
    return undefined;
  }
}