import { ReactNode } from "react";
import {
  getRowList,
  RowFactory,
  TrackVps,
} from "../../client/game/final_overview_row";
import { Phase } from "../../engine/state/phase";
import { insertAfter } from "../../utils/functions";
import { MapViewSettings } from "../view_settings";
import { DisfavorTrack } from "./disfavor_track";
import { DisfavorVps } from "./disfavor_vps";
import { LocoTrack } from "./loco_track";
import { StalinistRussiaLocomotiveSummary } from "./locomotive_summary";
import { DisfavorCell } from "./player_stats";
import { StalinistRussiaRules } from "./rules";
import { StalinistRussiaMapSettings } from "./settings";
import { StalinistRussiaRivers } from "./rivers";

export class StalinistRussiaViewSettings
  extends StalinistRussiaMapSettings
  implements MapViewSettings
{
  getMapRules = StalinistRussiaRules;
  getTexturesLayer = StalinistRussiaRivers;

  additionalSliders = [LocoTrack, DisfavorTrack];

  getFinalOverviewRows(): RowFactory[] {
    return insertAfter(getRowList(), TrackVps, DisfavorVps);
  }

  getActionSummary(phase: Phase | undefined): (() => ReactNode) | undefined {
    if (phase === Phase.STALINIST_LOCOMOTIVE) {
      return StalinistRussiaLocomotiveSummary;
    }
    return undefined;
  }

  getPlayerStatColumns() {
    return [
      {
        header: "Stalin's Disfavor",
        cell: DisfavorCell,
      },
    ];
  }
}
