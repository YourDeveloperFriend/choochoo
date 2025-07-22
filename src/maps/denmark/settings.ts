import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  ReleaseStage,
  Rotation,
} from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { AvailableActionsModule } from "../../modules/available_actions";
import { InstantProductionModule } from "../../modules/instant_production/module";
import { OneClaimLimitModule } from "../../modules/one_claim_limit";
import { PhasesModule } from "../../modules/phases";
import { AllowTownConnectionModule } from "../../modules/allow_town_connection";
import { remove } from "../../utils/functions";
import { interCityConnections } from "../factory";
import { DenmarkActionNamingProvider } from "./actions";
import { DenmarkSelectAction } from "./allowed_actions";
import {
  DenmarkBuildAction,
  DenmarkBuildPhase,
  DenmarkBuildValidator,
  DenmarkConnectCitiesAction,
} from "./build_validator";
import { DenmarkBuildCostCalculator } from "./cost";
import { DenmarkIncomeReduction, DenmarkProfitHelper } from "./expenses";
import { map } from "./grid";
import { DenmarkLocoAction } from "./loco";
import { DenmarkMoveHelper } from "./locomotive_special_action";
import { DenmarkMoneyManager } from "./money_manager";
import { DenmarkMoveValidator } from "./move_validator";
import { DenmarkShareHelper, DenmarkTakeSharesAction } from "./shares";
import { DenmarkStarter } from "./starter";

export class DenmarkMapSettings implements MapSettings {
  static readonly key = GameKey.DENMARK;
  readonly key = DenmarkMapSettings.key;
  readonly name = "Denmark";
  readonly designer = "J. C. Lawrence";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly interCityConnections = interCityConnections(map, [
    { connects: ["Hirtshals", "Europe"], cost: 4, center: [0, 17] },
    { connects: ["Hirtshals", "Europe"], cost: 6, center: [0, 18] },

    { connects: ["Frederikshaven", "Göteborg"], cost: 4, center: [1, 13] },
    { connects: ["Frederikshaven", "Göteborg"], cost: 6, center: [1, 12] },

    { connects: ["Frederikshaven", "Copenhagen"], cost: 4, center: [3, 11] },
    { connects: ["Frederikshaven", "Copenhagen"], cost: 6, center: [4, 10] },

    { connects: ["Aalborg", "Copenhagen"], cost: 4, center: [4, 11] },
    { connects: ["Aalborg", "Copenhagen"], cost: 6, center: [5, 10] },

    { connects: ["Århus", "Copenhagen"], cost: 4, center: [7, 9] },
    { connects: ["Århus", "Copenhagen"], cost: 6, center: [7, 8] },

    { connects: ["Malmö", "Copenhagen"], cost: 4, center: [6, 7] },
    { connects: ["Malmö", "Copenhagen"], cost: 6, center: [7, 6] },

    { connects: ["Århus", "Kalundborh"], cost: 4, center: [8, 11] },
    { connects: ["Århus", "Kalundborh"], cost: 6, center: [9, 10] },

    { connects: ["Nyborg", "Korsør"], cost: 4, center: [10, 9] },
    { connects: ["Nyborg", "Korsør"], cost: 6, center: [11, 8] },

    { connects: ["Nyborg", "Rødbyhavn"], cost: 4, center: [12, 8] },
    { connects: ["Nyborg", "Rødbyhavn"], cost: 6, center: [12, 7] },

    { connects: ["Nykøbing", "Korsør"], cost: 4, center: [12, 6] },
    { connects: ["Nykøbing", "Korsør"], cost: 6, center: [12, 5] },

    { connects: ["Rødbyhavn", "Puttgarden"], cost: 4, center: [14, 7] },
    { connects: ["Rødbyhavn", "Puttgarden"], cost: 6, center: [15, 7] },

    { connects: ["Nykøbing", "Warnemünde"], cost: 4, center: [15, 4] },
    { connects: ["Nykøbing", "Warnemünde"], cost: 6, center: [15, 3] },
  ]);
  readonly stage = ReleaseStage.ALPHA;
  readonly rotation = Rotation.CLOCKWISE;

  getOverrides() {
    return [
      DenmarkShareHelper,
      DenmarkTakeSharesAction,
      DenmarkIncomeReduction,
      DenmarkMoneyManager,
      DenmarkLocoAction,
      DenmarkSelectAction,
      DenmarkBuildCostCalculator,
      DenmarkBuildValidator,
      DenmarkBuildPhase,
      DenmarkConnectCitiesAction,
      DenmarkMoveValidator,
      DenmarkBuildAction,
      DenmarkStarter,
      DenmarkMoveHelper,
      DenmarkProfitHelper,
      DenmarkActionNamingProvider,
    ];
  }

  getModules(): Array<Module> {
    return [
      new OneClaimLimitModule(),
      new InstantProductionModule(),
      new AvailableActionsModule({ remove: [Action.PRODUCTION] }),
      new PhasesModule({
        replace: (phases) => remove(phases, Phase.GOODS_GROWTH),
      }),
      // On the Denmark map, towns do not need to be urbanized to claim a link, though goods cannot
      // be moved across until a route is built. See DenmarkMoveValidator.
      new AllowTownConnectionModule(),
    ];
  }
}
