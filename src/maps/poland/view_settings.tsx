import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { Phase } from "../../engine/state/phase";
import { MapViewSettings } from "../view_settings";
import { PolandProductionAction } from "./goods_growth";
import { PolandProduction } from "./production_action_summary";
import { PolandRules } from "./rules";
import { PolandMapSettings } from "./settings";

export class PolandViewSettings
  extends PolandMapSettings
  implements MapViewSettings
{
  getMapRules = PolandRules;
  useOnMapClick = usePolandProduction;
  getActionSummary(phase: Phase) {
    if (phase === Phase.GOODS_GROWTH) {
      return PolandProduction;
    }
  }
}

function usePolandProduction(on: OnClickRegister) {
  const { canEmit, emit, isPending } = useAction(PolandProductionAction);
  if (canEmit) {
    on(ClickTarget.TOWN, (town) => emit({ coordinates: town.coordinates }));
  }
  return isPending;
}
