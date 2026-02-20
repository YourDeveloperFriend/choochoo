import { MapViewSettings } from "../view_settings";
import { EasternUsAndCanadaRivers } from "./rivers";
import { EasternUsAndCanadaMapSettings } from "./settings";
import { EasternUsAndCanadaRules } from "./rules";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { ProductionAction } from "./production";
import { Phase } from "../../engine/state/phase";
import React from "react";
import { EasternUsAndCanadaSpecialActionSelector } from "./production_summary";

export class EasternUsAndCanadaViewSettings
  extends EasternUsAndCanadaMapSettings
  implements MapViewSettings
{
  getTexturesLayer = EasternUsAndCanadaRivers;

  getMapRules = EasternUsAndCanadaRules;

  useOnMapClick = useOnMapClick;

  getActionSummary(
    phase: Phase | undefined,
  ): (() => React.ReactNode) | undefined {
    if (phase === Phase.ACTION_SELECTION) {
      return EasternUsAndCanadaSpecialActionSelector;
    }
    return undefined;
  }
}

function useOnMapClick(on: OnClickRegister) {
  const { canEmit, emit, isPending } = useAction(ProductionAction);
  if (canEmit) {
    on(ClickTarget.CITY, (city) => emit({ coordinates: city.coordinates }));
  }
  return isPending;
}
