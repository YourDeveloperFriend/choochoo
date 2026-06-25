import { useMemo } from "react";
import { ChesapeakeAndOhioRules } from "./rules";
import { ChesapeakeAndOhioMapSettings } from "./settings";
import { MapViewSettings } from "../view_settings";
import { Phase } from "../../engine/state/phase";
import { PlayerData } from "../../engine/state/player";
import { BuildActionSummary } from "./build_action_summary";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { useGrid } from "../../client/utils/injection_context";
import { BuildFactoryAction, ChesapeakeAndOhioMapData } from "./build";
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
  useExpenseBreakdownItems = useChesapeakeExpenseBreakdown;
}

function useChesapeakeExpenseBreakdown(
  player: PlayerData,
): Array<{ label: string; value: number }> {
  const grid = useGrid();

  const factoryCount = useMemo(() => {
    let count = 0;
    for (const city of grid.cities()) {
      const mapData = city.getMapSpecific(ChesapeakeAndOhioMapData.parse);
      if (mapData && mapData.factoryColor === player.color) {
        count += 1;
      }
    }
    return count;
  }, [grid, player.color]);

  if (factoryCount === 0) return [];
  return [{ label: "Factory maintenance:", value: factoryCount }];
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
