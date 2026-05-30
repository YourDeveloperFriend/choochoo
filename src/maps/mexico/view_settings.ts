import React from "react";
import { Phase } from "../../engine/state/phase";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { MapViewSettings } from "../view_settings";
import { MexicoRules } from "./rules";
import { MexicoMapSettings } from "./settings";
import {
  MexicoProductionSummary,
  MexicoRoleSelectionSummary,
} from "./action_summary";
import { MexicoProductionPlaceAction } from "./goods_growth";
import { RoleCell } from "./player_stats";

export class MexicoViewSettings
  extends MexicoMapSettings
  implements MapViewSettings
{
  getMapRules = MexicoRules;

  getPlayerStatColumns() {
    return [
      {
        header: "Role",
        cell: RoleCell,
      },
    ];
  }

  getActionSummary(
    phase: Phase | undefined,
  ): (() => React.ReactNode) | undefined {
    switch (phase) {
      case Phase.MEXICO_ROLE_SELECTION:
        return MexicoRoleSelectionSummary;
      case Phase.GOODS_GROWTH:
        return MexicoProductionSummary;
    }
    return undefined;
  }

  useOnMapClick = useMexicoMapClick;
}

function useMexicoMapClick(on: OnClickRegister) {
  const placeAction = useAction(MexicoProductionPlaceAction);

  if (placeAction.canEmit && placeAction.data?.good != null) {
    const good = placeAction.data.good;
    on(ClickTarget.CITY, ({ coordinates }) =>
      placeAction.emit({ good, coordinates }),
    );
  }

  return placeAction.isPending;
}
