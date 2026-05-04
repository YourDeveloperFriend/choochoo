import { MapViewSettings } from "../view_settings";
import { CaliforniaGoldRushRivers } from "./rivers";
import { CaliforniaGoldRushRules } from "./rules";
import { CaliforniaGoldRushMapSettings } from "./settings";
import { GoldCell } from "./player_stats";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { CaliforniaGoldRushMineAction } from "./mine_action";
import { Good } from "../../engine/state/good";
import { Space } from "../../engine/map/grid";
import { Land } from "../../engine/map/location";
import { useCurrentPlayer } from "../../client/utils/injection_context";
import {
  getRowList,
  RowFactory,
  TrackVps,
} from "../../client/game/final_overview_row";
import { insertAfter } from "../../utils/functions";
import { GoldVps } from "./gold_vps";

export class CaliforniaGoldRushViewSettings
  extends CaliforniaGoldRushMapSettings
  implements MapViewSettings
{
  getTexturesLayer = CaliforniaGoldRushRivers;

  getMapRules = CaliforniaGoldRushRules;

  getPlayerStatColumns() {
    return [
      {
        header: "Gold",
        cell: GoldCell,
      },
    ];
  }

  useOnMapClick = useMineGoldClick;

  getFinalOverviewRows(): RowFactory[] {
    return insertAfter(getRowList(), TrackVps, GoldVps);
  }
}

function useMineGoldClick(on: OnClickRegister) {
  const { canEmit, emit, isPending } = useAction(CaliforniaGoldRushMineAction);
  const current = useCurrentPlayer();

  if (canEmit) {
    on(ClickTarget.GOOD, (space: Space, good): boolean => {
      if (good === Good.YELLOW && space instanceof Land) {
        const hasTrack = space
          .getTrack()
          .find((t) => t.getOwner() === current?.color);
        if (hasTrack) {
          emit({ coordinates: space.coordinates });
          return true;
        }
      }
      return false;
    });
  }
  return isPending;
}
