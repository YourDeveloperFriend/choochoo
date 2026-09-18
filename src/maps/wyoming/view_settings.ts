import { WyomingRules } from "./rules";
import { WyomingMapSettings } from "./settings";
import { MapViewSettings } from "../view_settings";
import { LocoDiscCell } from "./player_stats";

export class WyomingViewSettings
  extends WyomingMapSettings
  implements MapViewSettings
{
  getMapRules = WyomingRules;

  getPlayerStatColumns() {
    return [
      {
        header: "Loco Discs",
        cell: LocoDiscCell,
      },
    ];
  }
}
