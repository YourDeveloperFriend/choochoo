import {
  getRowList,
  RowFactory,
  TrackVps,
} from "../../client/game/final_overview_row";
import { insertAfter } from "../../utils/functions";
import { MapViewSettings } from "../view_settings";
import { GarbageVps } from "./garbage_vps";
import { SwedenRules } from "./rules";
import { SwedenRecyclingMapSettings } from "./settings";

export class SwedenRecyclingViewSettings
  extends SwedenRecyclingMapSettings
  implements MapViewSettings
{
  getMapRules = SwedenRules;

  getFinalOverviewRows(): RowFactory[] {
    return insertAfter(getRowList(), TrackVps, GarbageVps);
  }
}
