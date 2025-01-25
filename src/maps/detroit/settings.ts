import {
  getRowList,
  IncomeVps,
  RowFactory,
  SharesVps,
  TotalVps,
  TrackVps,
} from "../../client/game/final_overview_row";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { Action } from "../../engine/state/action";
import { insertBefore } from "../../utils/functions";
import { interCityConnections } from "../factory";
import { getActionCaption } from "./action_caption";
import {
  DetroitAllowedActions,
  DetroitSelectAction,
  DetroitSelectActionPhase,
} from "./actions";
import {
  DetroitMoneyManager,
  DetroitPlayerHelper,
  DetroitRoundEngine,
} from "./end_game";
import { DetroitBuildAction, DetroitCostCalculator } from "./engineer";
import {
  DetroitIncomeReduction,
  DetroitProfitHelper,
  DetroitShareHelper,
} from "./expenses";
import { map } from "./grid";
import { DetroitMoveAction } from "./move";
import { RoundsLasted } from "./rounds_lasted";
import { DetroitRules } from "./rules";
import { DetroitGoodsGrowthPhase } from "./solo";
import { DetroitStarter } from "./starter";

export class DetroitBankruptcyMapSettings implements MapSettings {
  static readonly key = "detroit-bankruptcy";
  readonly key = DetroitBankruptcyMapSettings.key;
  readonly name = "Detroit Bankruptcy";
  readonly minPlayers = 1;
  readonly maxPlayers = 3;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;
  readonly interCityConnections = interCityConnections(map, [
    ["Midtown Detroit", "Downtown Detroit"],
    ["Windsor", "Windsor Airport"],
  ]).map((connection) => ({ ...connection, cost: 6 }));

  getMapRules = DetroitRules;
  getActionCaption = getActionCaption;

  getFinalOverviewRows(): RowFactory[] {
    const rowList = getRowList();
    const toRemove = new Set([TotalVps, IncomeVps, SharesVps, TrackVps]);
    return insertBefore(rowList, TotalVps, RoundsLasted).filter(
      (a) => !toRemove.has(a),
    );
  }

  getOverrides() {
    return [
      DetroitAllowedActions,
      DetroitProfitHelper,
      DetroitIncomeReduction,
      DetroitMoneyManager,
      DetroitPlayerHelper,
      DetroitRoundEngine,
      DetroitShareHelper,
      DetroitStarter,
      DetroitMoveAction,
      DetroitBuildAction,
      DetroitSelectAction,
      DetroitCostCalculator,
      DetroitGoodsGrowthPhase,
      DetroitSelectActionPhase,
    ];
  }

  getActionDescription(action: Action): string | undefined {
    if (action === Action.ENGINEER) {
      return "Build an additional track during the Building step, and the cheapest build is free.";
    }
  }
}
