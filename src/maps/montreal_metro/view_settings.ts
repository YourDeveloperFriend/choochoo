import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { useInjectedState } from "../../client/utils/injection_context";
import { PlayerData } from "../../engine/state/player";
import { MapViewSettings } from "../view_settings";
import { GovtBuildOrder } from "./govt_build_order";
import { GOVERNMENT_ENGINE_LEVEL } from "./government_engine_level";
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
  useExpenseBreakdownItems = useMontrealMetroExpenseBreakdown;
}

function useMontrealMetroExpenseBreakdown(
  player: PlayerData,
): Array<{ label: string; value: number }> {
  const govtEngineLevel = useInjectedState(GOVERNMENT_ENGINE_LEVEL);
  const level = govtEngineLevel.get(player.color) ?? 0;

  if (level === 0) return [];
  return [{ label: "Government engine level:", value: level }];
}

function useRepopulateOnClick(on: OnClickRegister) {
  const { data, canEmit, emit, isPending } = useAction(RepopulateAction);
  const good = data?.good;
  if (canEmit && good != null) {
    on(ClickTarget.CITY, ({ coordinates }) => emit({ good, coordinates }));
  }
  return isPending;
}
