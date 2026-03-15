import { MapViewSettings } from "../view_settings";
import { MinasGeraesOverlayLayer, MinasGeraesRivers } from "./rivers";
import { MinasGeraesRules } from "./rules";
import { MinasGeraesMapSettings } from "./settings";
import { MiningExpertiseCell } from "./player_stats";
import { SpendMiningExpertise } from "./spend-mining-expertise";
import { Phase } from "../../engine/state/phase";
import React from "react";
import { SpecialActionSelectorSummary } from "./pick-goldsmith-variant-modal";
import { RedrawProduction } from "./redraw_production";

export class MinasGeraesViewSettings
  extends MinasGeraesMapSettings
  implements MapViewSettings
{
  getTexturesLayer = MinasGeraesRivers;
  getOverlayLayer = MinasGeraesOverlayLayer;

  getMapRules = MinasGeraesRules;

  additionalSliders = [SpendMiningExpertise];

  getPlayerStatColumns() {
    return [
      {
        header: "Mining Expertise",
        cell: MiningExpertiseCell,
      },
    ];
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
}
