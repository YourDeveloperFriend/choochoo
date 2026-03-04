import {
  getRowList,
  IncomeVps,
  Place,
  RowFactory,
  SharesVps,
  TotalVps,
  TrackVps,
} from "../../client/game/final_overview_row";
import { useInject, useInjectedState } from "../../client/utils/injection_context";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { ROUND } from "../../engine/game/round";
import { Action } from "../../engine/state/action";
import { PlayerData } from "../../engine/state/player";
import { insertBefore } from "../../utils/functions";
import { getActionCaption } from "./action_caption";
import { SoloPlacement } from "./final_solo_situation";
import { RoundsLasted } from "./rounds_lasted";
import { DetroitRules } from "./rules";
import { DetroitBankruptcyMapSettings } from "./settings";

export class DetroitBankruptcyViewSettings extends DetroitBankruptcyMapSettings {
  getMapRules = DetroitRules;
  getActionCaption = getActionCaption;
  hideScoreBreakdown = true; // Detroit uses survival-based tuple scoring, not VPs
  useExpenseBreakdownItems = useDetroitExpenseBreakdown;

  getFinalOverviewRows(): RowFactory[] {
    const playerCount = useInject(() => injectInitialPlayerCount()(), []);
    const rowList = getRowList();
    const toRemove = new Set([TotalVps, IncomeVps, SharesVps, TrackVps]);
    const newList = insertBefore(rowList, TotalVps, RoundsLasted).filter(
      (a) => !toRemove.has(a),
    );
    if (playerCount > 1) {
      return newList;
    }
    return insertBefore(newList, Place, SoloPlacement).filter(
      (a) => a !== Place,
    );
  }

  getActionDescription(action: Action): string | undefined {
    if (action === Action.ENGINEER) {
      return "Build an additional track during the Building step, and the cheapest build is free.";
    }
  }
}

function useDetroitExpenseBreakdown(
  _player: PlayerData,
): Array<{ label: string; value: number }> {
  const round = useInjectedState(ROUND);
  return [{ label: "Round expense:", value: round }];
}