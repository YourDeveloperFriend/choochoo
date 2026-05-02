import { MapViewSettings } from "../view_settings";
import { MinasGeraesOverlayLayer, MinasGeraesRivers } from "./rivers";
import { MinasGeraesRules } from "./rules";
import { MinasGeraesMapSettings } from "./settings";
import { MiningExpertiseCell } from "./player_stats";
import {
  MiningExpertiseScoringRow,
  SpendMiningExpertise,
} from "./spend-mining-expertise";
import { Phase } from "../../engine/state/phase";
import React from "react";
import { SpecialActionSelectorSummary } from "./pick-goldsmith-variant-modal";
import { RedrawProduction } from "./redraw_production";
import { Action } from "../../engine/state/action";
import { useInjectedState } from "../../client/utils/injection_context";
import { ActionMoney } from "./starter";
import {
  getRowList,
  RowFactory,
  TrackVps,
} from "../../client/game/final_overview_row";
import { insertAfter } from "../../utils/functions";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { BuildAction } from "../../engine/build/build";

export class MinasGeraesViewSettings
  extends MinasGeraesMapSettings
  implements MapViewSettings
{
  getTexturesLayer = MinasGeraesRivers;
  getOverlayLayer = MinasGeraesOverlayLayer;

  getMapRules = MinasGeraesRules;

  useOnMapClick = useBuildOnClick;

  additionalSliders = [SpendMiningExpertise];

  getPlayerStatColumns() {
    return [
      {
        header: "Mining Expertise",
        cell: MiningExpertiseCell,
      },
    ];
  }

  getFinalOverviewRows(): RowFactory[] {
    return insertAfter(getRowList(), TrackVps, MiningExpertiseScoringRow);
  }

  getActionSummary(
    phase: Phase | undefined,
  ): (() => React.ReactNode) | undefined {
    if (phase === Phase.ACTION_SELECTION) {
      return SpecialActionSelectorSummary;
    }
    if (phase === Phase.GOODS_GROWTH) {
      return RedrawProduction;
    }

    return undefined;
  }

  getActionCaption(action: Action): string[] | string | undefined {
    const actionCost = useInjectedState(ActionMoney).get(action);
    if (actionCost === undefined || actionCost === 0) {
      return undefined;
    }
    return "$" + actionCost;
  }
}

function useBuildOnClick(on: OnClickRegister) {
  const { canEmit, isPending, setData } = useAction(BuildAction);

  if (canEmit) {
    on(ClickTarget.CITY, (city) => setData({ coordinates: city.coordinates }));
  }
  return isPending;
}
export const viewSettings = new MinasGeraesViewSettings();
