import {
  getRowList,
  RowFactory,
  TrackVps,
} from "../../client/game/final_overview_row";
import { useInjected } from "../../client/utils/injection_context";
import { PlayerData } from "../../engine/state/player";
import { insertAfter } from "../../utils/functions";
import { MapViewSettings } from "../view_settings";
import { GarbageVps } from "./garbage_vps";
import { SwedenRules } from "./rules";
import { SwedenPlayerHelper } from "./score";
import { SwedenRecyclingMapSettings } from "./settings";

export class SwedenRecyclingViewSettings
  extends SwedenRecyclingMapSettings
  implements MapViewSettings
{
  getMapRules = SwedenRules;
  useScoreBreakdownItems = useSwedenScoreBreakdown;

  getFinalOverviewRows(): RowFactory[] {
    return insertAfter(getRowList(), TrackVps, GarbageVps);
  }
}

function useSwedenScoreBreakdown(
  player: PlayerData,
): Array<{ label: string; value: number }> {
  const playerHelper = useInjected(SwedenPlayerHelper);
  const points = playerHelper.getScoreFromGarbage(player);
  const count = points / 2;

  if (points === 0) return [];
  return [{ label: `Garbage (${count} cubes × 2):`, value: points }];
}
