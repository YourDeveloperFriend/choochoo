import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { interCityConnections } from "../factory";
import {
  DetroitAllowedActions,
  DetroitSelectAction,
  DetroitSelectActionPhase,
  DetroitSkipAction,
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
  readonly designer = "Chad Deshon";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 1;
  readonly maxPlayers = 5;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.RECOMMENDED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.RECOMMENDED,
    5: PlayerCountRating.RECOMMENDED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
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
      DetroitSkipAction,
    ];
  }
}
