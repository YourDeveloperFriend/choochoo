import { GameKey } from "../../api/game_key";
import {
  MapSettings,
  ReleaseStage,
  Rotation,
} from "../../engine/game/map_settings";
import { interCityConnections } from "../factory";
import { map } from "./grid";
import {DenmarkShareHelper, DenmarkTakeSharesAction} from "./shares";
import {DenmarkIncomeReduction} from "./expenses";
import {DenmarkMoneyManager} from "./money_manager";
import {DenmarkAllowedActions, DenmarkSelectAction} from "./allowed_actions";
import {DenmarkPhaseEngine} from "./production";
import {DenmarkLocoAction} from "./loco";
import {DenmarkBuildCostCalculator} from "./cost";
import {DenmarkBuildValidator} from "./build_validator";

export class DenmarkMapSettings implements MapSettings {
  static readonly key = GameKey.DENMARK;
  readonly key = DenmarkMapSettings.key;
  readonly name = "Denmark";
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
  readonly stage = ReleaseStage.DEVELOPMENT;
  readonly rotation = Rotation.CLOCKWISE;

  getOverrides() {
    return [
        DenmarkShareHelper,
        DenmarkTakeSharesAction,
        DenmarkIncomeReduction,
        DenmarkMoneyManager,
        DenmarkAllowedActions,
        DenmarkPhaseEngine,
        DenmarkLocoAction,
        DenmarkSelectAction,
        DenmarkBuildCostCalculator,
        DenmarkBuildValidator,
    ];
  }
}
