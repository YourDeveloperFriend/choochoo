import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { interCityConnections } from "../factory";
import { DetroitAllowedActions, DetroitSelectAction } from "./actions";
import { DetroitMoneyManager, DetroitPlayerHelper, DetroitRoundEngine } from "./end_game";
import { DetroitBuildAction, DetroitCostCalculator } from "./engineer";
import { DetroitIncomeReduction, DetroitProfitHelper, DetroitShareHelper } from "./expenses";
import { map } from "./grid";
import { DetroitMoveAction } from "./move";
import { DetroitGoodsGrowthPhase } from "./solo";
import { DetroitStarter } from "./starter";

export class DetroitBankruptcyMapSettings implements MapSettings {
  static readonly key = 'detroit-bankruptcy';
  readonly key = DetroitBankruptcyMapSettings.key;
  readonly name = 'Detroit Bankruptcy';
  readonly minPlayers = 1;
  readonly maxPlayers = 3;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;
  readonly interCityConnections =
    interCityConnections(map, [['Midtown Detroit', 'Downtown Detroit'], ['Windsor', 'Windsor Airport']])
      .map((connection) => ({ ...connection, cost: 6 }));

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
    ];
  }
}