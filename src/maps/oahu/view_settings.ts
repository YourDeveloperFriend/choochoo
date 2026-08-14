import { ReactNode } from "react";
import { Phase } from "../../engine/state/phase";
import { MapViewSettings } from "../view_settings";
import { OahuActionSelector } from "./action_summary";
import { OahuRules } from "./rules";
import { OahuOverlayLayer } from "./layers";
import { OahuMapSettings } from "./settings";

export class OahuViewSettings
  extends OahuMapSettings
  implements MapViewSettings
{
  getMapRules = OahuRules;
  getOverlayLayer = OahuOverlayLayer;

  getActionSummary(phase: Phase | undefined): (() => ReactNode) | undefined {
    if (phase === Phase.ACTION_SELECTION) {
      return OahuActionSelector;
    }
    return undefined;
  }
}
