import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { ChesapeakeAndOhioActionNamingProvider } from "./actions";
import {
  ChesapeakeAndOhioBuildAction,
  ChesapeakeAndOhioBuildPhase,
} from "./build";
import { ChesapeakeAndOhioClaimAction } from "./claim_action";
import {
  ChesapeakeAndOhioLocoAction,
  ChesapeakeAndOhioMoveAction,
  ChesapeakeAndOhioMoveHelper,
  ChesapeakeAndOhioMovePhase,
  ChesapeakeAndOhioMoveValidator,
} from "./deliver";
import { ChesapeakeAndOhioProfitHelper } from "./expenses";
import { map } from "./grid";
import { ChesapeakeAndOhioPhaseEngine } from "./phase";
import { ChesapeakeAndOhioStarter } from "./starter";
import { ChesapeakeAndOhioUrbanizeAction } from "./urbanize";
import { ChesapeakeAndOhioMoveInterceptor } from "./move_interceptor";

export class ChesapeakeAndOhioMapSettings implements MapSettings {
  static readonly key = GameKey.CHESAPEAKE_AND_OHIO;
  readonly key = ChesapeakeAndOhioMapSettings.key;
  readonly name = "Chesapeake & Ohio";
  readonly designer = "David Fair";
  readonly implementerId = JACK;
  readonly minPlayers = 4;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      ChesapeakeAndOhioStarter,
      ChesapeakeAndOhioPhaseEngine,
      ChesapeakeAndOhioClaimAction,
      ChesapeakeAndOhioBuildAction,
      ChesapeakeAndOhioBuildPhase,
      ChesapeakeAndOhioUrbanizeAction,
      ChesapeakeAndOhioProfitHelper,
      ChesapeakeAndOhioMovePhase,
      ChesapeakeAndOhioMoveHelper,
      ChesapeakeAndOhioMoveAction,
      ChesapeakeAndOhioLocoAction,
      ChesapeakeAndOhioActionNamingProvider,
      ChesapeakeAndOhioMoveValidator,
      ChesapeakeAndOhioMoveInterceptor,
    ];
  }
}
