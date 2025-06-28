import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { MapViewSettings } from "../view_settings";
import { GovtBuildOrder } from "./govt_build_order";
import { LocoTrack } from "./loco_track";
import { MontrealMetroRules } from "./rules";
import { RepopulateAction } from "./select_action/repopulate";
import { MontrealMetroMapSettings } from "./settings";
import { MontrealStreets } from "./street";

export class MontrealMetroViewSettings
  extends MontrealMetroMapSettings
  implements MapViewSettings
{
  getMapRules = MontrealMetroRules;

  getTexturesLayer = MontrealStreets;

  additionalSliders = [LocoTrack, GovtBuildOrder];

  useOnMapClick = useRepopulateOnClick;
}

function useRepopulateOnClick(on: OnClickRegister) {
  const { data, canEmit, emit, isPending } = useAction(RepopulateAction);
  const good = data?.good;
  if (canEmit && good != null) {
    on(ClickTarget.CITY, ({ coordinates }) => emit({ good, coordinates }));
  }
  return isPending;
}
