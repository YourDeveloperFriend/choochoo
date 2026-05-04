import { ChesapeakeAndOhioRules } from "./rules";
import { ChesapeakeAndOhioMapSettings } from "./settings";
import { MapViewSettings } from "../view_settings";
import { Phase } from "../../engine/state/phase";
import { BuildActionSummary } from "./build_action_summary";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { BuildFactoryAction } from "./build";
import {
  ChesapeakeAndOhioOverlayLayer,
  ChesapeakeAndOhioRivers,
} from "./rivers";
import { ChesapeakeAndOhioMoveInterceptorModal } from "./move_interceptor_modal";

export class ChesapeakeAndOhioViewSettings
  extends ChesapeakeAndOhioMapSettings
  implements MapViewSettings
{
  getMapRules = ChesapeakeAndOhioRules;
  getTexturesLayer = ChesapeakeAndOhioRivers;
  getOverlayLayer = ChesapeakeAndOhioOverlayLayer;
  moveInterceptModal = ChesapeakeAndOhioMoveInterceptorModal;

  getActionSummary(phase: Phase) {
    if (phase === Phase.BUILDING) {
      return BuildActionSummary;
    }
  }
  useOnMapClick = useFactoryClick;
}

function useFactoryClick(on: OnClickRegister) {
  const { canEmit, emit, isPending } = useAction(BuildFactoryAction);

  if (canEmit) {
    on(ClickTarget.CITY, ({ coordinates }) => {
      emit({ coordinates });
    });
  }
  return isPending;
}
