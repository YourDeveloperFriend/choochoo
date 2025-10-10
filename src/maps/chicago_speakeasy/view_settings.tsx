import { MapViewSettings } from "../view_settings";
import { ChicagoSpeakeasyRivers } from "./rivers";
import { ChicagoSpeakeasyMapSettings } from "./settings";
import { ChicagoSpeakeasyRules } from "./rules";
import { Phase } from "../../engine/state/phase";
import { MoveActionSummary } from "./move_action_summary";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { BumpOffAction } from "./bump_off";
import { Good } from "../../engine/state/good";

export class ChicagoSpeakeasyViewSettings
  extends ChicagoSpeakeasyMapSettings
  implements MapViewSettings
{
  getTexturesLayer = ChicagoSpeakeasyRivers;

  getMapRules = ChicagoSpeakeasyRules;

  getActionSummary(phase: Phase) {
    if (phase === Phase.MOVING) {
      return MoveActionSummary;
    }
  }

  useOnMapClick = useBumpOffOnClick;
}

function useBumpOffOnClick(on: OnClickRegister) {
  const { canEmit, isPending, setData, clearData } = useAction(BumpOffAction);
  if (canEmit) {
    on(ClickTarget.GOOD, (land, good) => {
      if (good === Good.BLACK) {
        setData({ coordinates: land.coordinates });
      } else {
        clearData();
      }
      return false;
    });
  }
  return isPending;
}
