import { MapViewSettings } from "../view_settings";
import { DoubleBaseUsaRivers } from "./rivers";
import { DoubleBaseUsaMapSettings } from "./settings";
import { Phase } from "../../engine/state/phase";
import React from "react";
import { DoubleBaseUsaBuildPhaseSummary } from "./starting_city_summary";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { SelectStartingCityAction } from "./starting_city";
import { DoubleBaseUsaSpecialActionSelector } from "./production_summary";
import { ProductionAction } from "./production";
import { BonusLocoCell, LandGrantCell } from "./player_stats";
import { DoubleBaseUsaOverlayLayer } from "./overlay_layer";
import { DoubleBaseUsaMoveActionSummary } from "./move_action_summary";
import { DoubleBaseUsaRules } from "./rules";

export class DoubleBaseUsaViewSettings
  extends DoubleBaseUsaMapSettings
  implements MapViewSettings
{
  getTexturesLayer = DoubleBaseUsaRivers;

  getActionSummary(
    phase: Phase | undefined,
  ): (() => React.ReactNode) | undefined {
    if (phase === Phase.BUILDING) {
      return DoubleBaseUsaBuildPhaseSummary;
    }
    if (phase === Phase.ACTION_SELECTION) {
      return DoubleBaseUsaSpecialActionSelector;
    }
    if (phase === Phase.MOVING) {
      return DoubleBaseUsaMoveActionSummary;
    }
    return undefined;
  }

  getPlayerStatColumns() {
    return [
      {
        header: "Bonus Loco Discs",
        cell: BonusLocoCell,
      },
      {
        header: "Land Grant Cubes",
        cell: LandGrantCell,
      },
    ];
  }

  getOverlayLayer = DoubleBaseUsaOverlayLayer;

  getMapRules = DoubleBaseUsaRules;

  useOnMapClick = useOnMapClick;
}

function useOnMapClick(on: OnClickRegister) {
  const selectStartingCityAction = useAction(SelectStartingCityAction);
  const productionAction = useAction(ProductionAction);

  if (selectStartingCityAction.canEmit) {
    const color = selectStartingCityAction.data?.color;
    on(ClickTarget.CITY, (city) =>
      selectStartingCityAction.emit({
        color: color,
        coordinates: city.coordinates,
      }),
    );
  }
  if (
    productionAction.canEmit &&
    productionAction.data !== undefined &&
    productionAction.data.good !== undefined
  ) {
    const good = productionAction.data.good;
    on(ClickTarget.CITY, (city) =>
      productionAction.emit({ good: good, coordinates: city.coordinates }),
    );
  }

  return selectStartingCityAction.isPending || productionAction.isPending;
}
