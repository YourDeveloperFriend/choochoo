import { Action } from "../../engine/state/action";
import { MadagascarRules } from "./rules";
import { MadagascarMapSettings } from "./settings";

export class MadagascarViewSettings extends MadagascarMapSettings {
  getMapRules = MadagascarRules;

  getActionDescription(action: Action): string | undefined {
    if (action === Action.LOCOMOTIVE) {
      return 'Immediately, increase your locomotive by one, but you cannot build track this turn.';
    }
    if (action === Action.URBANIZATION) {
      return 'Place a new city on any town during the build step, but may only build one track tile.';
    }
    return undefined;
  }
}