import {MapViewSettings, TexturesProps} from "../view_settings";
import {MinasGeraesOverlayLayer, MinasGeraesRivers} from "./rivers";
import { MinasGeraesRules } from "./rules";
import { MinasGeraesMapSettings } from "./settings";
import { MiningExpertiseCell} from "./player_stats";
import {SpendMiningExpertise} from "./spend-mining-expertise";

export class MinasGeraesViewSettings
  extends MinasGeraesMapSettings
  implements MapViewSettings
{
  getTexturesLayer = MinasGeraesRivers;
  getOverlayLayer = MinasGeraesOverlayLayer;

  getMapRules = MinasGeraesRules;

  additionalSliders = [SpendMiningExpertise];

  getPlayerStatColumns() {
    return [
      {
        header: "Mining Expertise",
        cell: MiningExpertiseCell,
      },
    ];
  }
}
