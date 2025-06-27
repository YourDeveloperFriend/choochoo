import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { map } from "./grid";
import { ChesapeakeAndOhioStarter } from "./starter";
import { ChesapeakeAndOhioPhaseEngine } from "./phase";
import { ChesapeakeAndOhioClaimAction } from "./claim_action";
import {
  ChesapeakeAndOhioBuildAction,
  ChesapeakeAndOhioBuildPhase,
} from "./build";
import { ChesapeakeAndOhioUrbanizeAction } from "./urbanize";
import { ChesapeakeAndOhioProfitHelper } from "./expenses";
import {
  ChesapeakeAndOhioLocoAction,
  ChesapeakeAndOhioMoveAction,
  ChesapeakeAndOhioMoveHelper,
  ChesapeakeAndOhioMovePhase,
  ChesapeakeAndOhioMoveValidator,
} from "./deliver";
import { ChesapeakeAndOhioActionNamingProvider } from "./actions";

export class ChesapeakeAndOhioMapSettings implements MapSettings {
  static readonly key = GameKey.CHESAPEAKE_AND_OHIO;
  readonly key = ChesapeakeAndOhioMapSettings.key;
  readonly name = "Chesapeake & Ohio";
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
    ];
  }
}
