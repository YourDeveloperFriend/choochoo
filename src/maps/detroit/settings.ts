import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { interCityConnections } from "../factory";
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
import { DetroitDiscountManager } from "./engineer";
import {
  DetroitIncomeReduction,
  DetroitProfitHelper,
  DetroitShareHelper,
} from "./expenses";
import { map } from "./grid";
import { DetroitMoveAction } from "./move";
import { DetroitGoodsGrowthPhase } from "./solo";
import { DetroitStarter } from "./starter";

export class DetroitBankruptcyMapSettings implements MapSettings {
  static readonly key = GameKey.DETROIT;
  readonly key = DetroitBankruptcyMapSettings.key;
  readonly name = "Detroit Bankruptcy";
  readonly minPlayers = 1;
  readonly maxPlayers = 5;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;
  readonly interCityConnections = interCityConnections(map, [
    { connects: ["Midtown Detroit", "Downtown Detroit"] },
    { connects: ["Windsor", "Windsor Airport"] },
  ]).map((connection) => ({ ...connection, cost: 6 }));

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
      DetroitSelectAction,
      DetroitGoodsGrowthPhase,
      DetroitDiscountManager,
      DetroitSelectActionPhase,
    ];
  }
}
