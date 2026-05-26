import { MapViewSettings } from "../view_settings";
import { CentralNewEnglandRules } from "./rules";
import { CentralNewEnglandMapSettings } from "./settings";
import { Action } from "../../engine/state/action";
import { useInjectedState } from "../../client/utils/injection_context";
import { ActionMoney } from "./action_selection";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { CentralNewEnglandProductionAction } from "./production";
import { Phase } from "../../engine/state/phase";
import React from "react";
import { CentralNewEnglandGoodsGrowthSummary } from "./goods_growth";
import {
  CentralNewEnglandOverlayLayer,
  CentralNewEnglandTexturesLayer,
} from "./rivers";

export class CentralNewEnglandViewSettings
  extends CentralNewEnglandMapSettings
  implements MapViewSettings
{
  getMapRules = CentralNewEnglandRules;
  getTexturesLayer = CentralNewEnglandTexturesLayer;
  getOverlayLayer = CentralNewEnglandOverlayLayer;

  getActionCaption(action: Action): string[] | string | undefined {
    const actionCost = useInjectedState(ActionMoney).get(action);
    if (actionCost === undefined || actionCost === 0) {
      return undefined;
    }
    return "$" + actionCost;
  }

  getActionSummary(
    phase: Phase | undefined,
  ): (() => React.ReactNode) | undefined {
    if (phase === Phase.GOODS_GROWTH) {
      return CentralNewEnglandGoodsGrowthSummary;
    }
    return undefined;
  }

  useOnMapClick = useOnMapClick;
}

function useOnMapClick(on: OnClickRegister) {
  const productionAction = useAction(CentralNewEnglandProductionAction);

  if (productionAction.canEmit) {
    on(ClickTarget.CITY, (city) =>
      productionAction.emit({ coordinates: city.coordinates }),
    );
  }

  return productionAction.isPending;
}
