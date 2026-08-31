import * as React from "react";
import { Phase } from "../../engine/state/phase";
import { MapViewSettings } from "../view_settings";
import { WyomingActionSelectorSummary } from "./disable-action-modal";
import { WyomingRules } from "./rules";
import { WyomingMapSettings } from "./settings";

export class WyomingViewSettings
  extends WyomingMapSettings
  implements MapViewSettings
{
  getMapRules = WyomingRules;

  getActionSummary(
    phase: Phase | undefined,
  ): (() => React.ReactNode) | undefined {
    if (phase === Phase.ACTION_SELECTION) {
      return WyomingActionSelectorSummary;
    }
    return undefined;
  }
}
