import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  ReleaseStage,
  Rotation,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { MinasGeraesStarter } from "./starter";
import { MinasGeraesMoveAction } from "./delivery";
import {
  MinasGeraesSelectAction,
  MinasGeraesSelectActionPhase,
} from "./action_selection";
import { MinasGeraesUrbanizeAction } from "./urbanize";
import { MinasGeraesBuildCostCalculator } from "./build";
import { Module } from "../../engine/module/module";
import { TurnLengthModule } from "../../modules/turn_length";
import { MinasGeraesPlayerHelper } from "./score";
import {
  MinasGeraesGoodsGrowthPhase,
  MinasGeraesProductionAction,
} from "./production";
import {
  MinasGeraesBuildPhase,
  MinasGeraesMovePhase,
  MinasGeraesSharesPhase,
  MinasGeraesTurnOrderPhase,
} from "./phase";

export class MinasGeraesMapSettings implements MapSettings {
  readonly key = GameKey.MINAS_GERAES;
  readonly name = "Minas Geraes";
  readonly designer = "Jose Silva";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;
  readonly developmentAllowlist = [JACK];
  readonly rotation = Rotation.COUNTER_CLOCKWISE;

  getOverrides() {
    return [
      MinasGeraesStarter,
      MinasGeraesMoveAction,
      MinasGeraesSelectAction,
      MinasGeraesSelectActionPhase,
      MinasGeraesUrbanizeAction,
      MinasGeraesBuildCostCalculator,
      MinasGeraesGoodsGrowthPhase,
      MinasGeraesPlayerHelper,
      MinasGeraesProductionAction,
      MinasGeraesSharesPhase,
      MinasGeraesTurnOrderPhase,
      MinasGeraesBuildPhase,
      MinasGeraesMovePhase,
    ];
  }

  getModules(): Array<Module> {
    return [new TurnLengthModule({ add: -1 })];
  }
}
