import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { MapViewSettings } from "../view_settings";
import { PolandMapSettings } from "./settings";
import { ProductionAction } from "./goods_growth";
import { PolandRules } from "./rules";
import { Phase } from "../../engine/state/phase";
import { PolandProduction } from "./production_action_summary";

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
  const { canEmit, emit, isPending } = useAction(ProductionAction);
  if (canEmit) {
    on(ClickTarget.TOWN, (town) => emit({ coordinates: town.coordinates }));
  }
  return isPending;
}
