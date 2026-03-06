import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  ReleaseStage,
  Rotation,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { UnionPacificExpressBuildCostCalculator } from "./build";
import { UnionPacificExpressUrbanizeAction } from "./urbanize";
import { UnionPacificExpressMoveHelper } from "./move";
import { UnionPacificExpressAllowedActions } from "./allowed_actions";
import { Module } from "../../engine/module/module";
import { TurnLengthModule } from "../../modules/turn_length";
import { UnionPacificExpressPhaseEngine } from "./phases";
import {
  UnionPacificExpressLocoAction,
  UnionPacificExpressMoveAction,
  UnionPacificExpressMovePassAction,
  UnionPacificExpressMovePhase,
  UnionPacificExpressMoveValidator,
} from "./deliver";
import { UnionPacificExpressStarter } from "./starter";

export class UnionPacificExpressMapSettings implements MapSettings {
  readonly key = GameKey.UNION_PACIFIC_EXPRESS;
  readonly name = "Union Pacific Express";
  readonly designer = "Kevin McCurdy";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 4;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.RECOMMENDED,
    5: PlayerCountRating.NOT_SUPPORTED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.BETA;
  readonly rotation = Rotation.CLOCKWISE;

  getOverrides() {
    return [
      UnionPacificExpressBuildCostCalculator,
      UnionPacificExpressUrbanizeAction,
      UnionPacificExpressAllowedActions,
      UnionPacificExpressPhaseEngine,
      UnionPacificExpressMoveHelper,
      UnionPacificExpressMovePassAction,
      UnionPacificExpressMovePhase,
      UnionPacificExpressMoveAction,
      UnionPacificExpressMoveValidator,
      UnionPacificExpressLocoAction,
      UnionPacificExpressStarter,
    ];
  }

  getModules(): Array<Module> {
    return [new TurnLengthModule({ turnLength: 6 })];
  }
}
