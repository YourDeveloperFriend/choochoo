import { Action } from "../../engine/state/action";
import { GermanyRules } from "./rules";
import { GermanyMapSettings } from "./settings";

export class GermanyViewSettings extends GermanyMapSettings {
  getMapRules = GermanyRules;

  getActionDescription(action: Action): string | undefined {
    if (action === Action.ENGINEER) {
      return 'Build one tile (the most expensive one) at half price (rounded down).';
    }
    return undefined;
  }
}