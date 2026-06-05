import React from "react";
import { VariantConfig } from "../../api/variant_config";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { Phase } from "../../engine/state/phase";
import { MapViewSettings } from "../view_settings";
import { MexicoVariantConfig } from "./variant_config";
import { MexicoVariantEditor } from "./variant_editor";
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
  getInitialVariantConfig(): VariantConfig {
    return {
      deterministicActions: false,
      redBlackProduction: false,
      productionForAll: false,
    };
  }

  getVariantConfigEditor = MexicoVariantEditor;

  getVariantString(variant: VariantConfig): string[] | undefined {
    const config = variant as MexicoVariantConfig;
    const tags: string[] = [];
    if (config.deterministicActions) {
      tags.push("Deterministic Disabled actions");
    }
    if (config.redBlackProduction) {
      tags.push("Red & Black Production");
    }
    if (config.productionForAll) {
      tags.push("Production For All");
    }
    return tags.length > 0 ? tags : undefined;
  }

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

  if (placeAction.canEmit) {
    if (placeAction.data?.good != null) {
      const good = placeAction.data.good;
      on(ClickTarget.CITY, ({ coordinates }) =>
        placeAction.emit({ good, coordinates }),
      );
    } else {
      // R&B variant: no good selection needed, emit with coordinates only
      on(ClickTarget.CITY, ({ coordinates }) =>
        placeAction.emit({ coordinates }),
      );
    }
  }

  return placeAction.isPending;
}
