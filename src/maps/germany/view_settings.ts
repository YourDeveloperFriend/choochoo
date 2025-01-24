import {Action} from "../../engine/state/action";
import {GermanyRules} from "./rules";
import {GermanyMapSettings} from "./settings";
import {MapViewSettings} from "../view_settings";
import {GermanyRivers} from "./rivers";

export class GermanyViewSettings extends GermanyMapSettings implements MapViewSettings {
  getMapRules = GermanyRules;
  getTexturesLayer = GermanyRivers;

  getActionDescription(action: Action): string | undefined {
    if (action === Action.ENGINEER) {
      return 'Build one tile (the most expensive one) at half price (rounded down).';
    }
    return undefined;
  }
}