import { ReactNode } from "react";
import { Phase } from "../../engine/state/phase";
import { MapViewSettings } from "../view_settings";
import { IsleOfWightActionSelectionSummary } from "./action_selection_summary";
import { IsleOfWightBuyTrainsSummary } from "./buy_trains_summary";
import { useFactoryClick } from "./factory_click";
import { IsleOfWightMoveSummary } from "./move_summary";
import { CouponsCell, TrainsCell } from "./player_stats";
import { IsleOfWightRules } from "./rules";
import { IsleOfWightScrapSummary } from "./scrap_summary";
import { IsleOfWightMapSettings } from "./settings";
import { TrainsPanel } from "./trains_panel";
import { IsleOfWightOverlayLayer } from "./rivers";

export class IsleOfWightViewSettings
  extends IsleOfWightMapSettings
  implements MapViewSettings
{
  getMapRules = IsleOfWightRules;
  useOnMapClick = useFactoryClick;
  getOverlayLayer = IsleOfWightOverlayLayer;

  additionalSliders = [TrainsPanel];

  getActionSummary(phase: Phase | undefined): (() => ReactNode) | undefined {
    switch (phase) {
      case Phase.ACTION_SELECTION:
        return IsleOfWightActionSelectionSummary;
      case Phase.STALINIST_LOCOMOTIVE:
        return IsleOfWightBuyTrainsSummary;
      case Phase.MOVING:
        return IsleOfWightMoveSummary;
      case Phase.SCRAP:
        return IsleOfWightScrapSummary;
      default:
        return undefined;
    }
  }

  getPlayerStatColumns() {
    return [
      { header: "Trains", cell: TrainsCell },
      { header: "Haggle coupons", cell: CouponsCell },
    ];
  }
}
