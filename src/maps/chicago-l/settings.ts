import { GameKey } from "../../api/game_key";
import {
  CORTEXBOMB,
  JACK,
  MapSettings,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { ChicagoLPhaseEngine, ChicagoLSharesPhase } from "./phase";
import { ChicagoLStarter } from "./starter";
import { ChicagoLShareHelper } from "./max_shares";
import { ChicagoLAllowedActions } from "./allowed_actions";
import { ChicagoLSelectAction } from "./repopulation/select_action";
import {
  ChicagoLBuildCostCalculator,
  ChicagoLBuilderHelper,
  ChicagoLUrbanizeAction,
} from "./build";
import {
  ChicagoLBuildAction,
  ChicagoLBuildPhase,
  ChicagoLPhaseDelegator,
} from "./government_track";
import { EngineerFreeBuildModule } from "../../modules/engineer_free_build";
import { ChicagoLMoveAction } from "./move_goods";
import { ChicagoLActionNamingProvider } from "./actions";
import { ChicagoLLocoAction } from "./loco_action";
import { ChicagoLPlayerHelper } from "./score";
import {
  ChicagoLBidAction,
  ChicagoLSelectActionPhase,
  ChicagoLTurnOrderPhase,
} from "./auction_tweak";
import { ChicagoLRoundEngine } from "./rounds";

export class ChicagoLMapSettings implements MapSettings {
  readonly key = GameKey.CHICAGO_L;
  readonly name = "Chicago L";
  readonly designer = "Michael Webb";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 3;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;
  readonly developmentAllowlist = [JACK, CORTEXBOMB];

  getOverrides() {
    return [
      ChicagoLPhaseEngine,
      ChicagoLStarter,
      ChicagoLSharesPhase,
      ChicagoLShareHelper,
      ChicagoLAllowedActions,
      ChicagoLSelectAction,
      ChicagoLBuilderHelper,
      ChicagoLUrbanizeAction,
      ChicagoLPhaseDelegator,
      ChicagoLBuildAction,
      ChicagoLMoveAction,
      ChicagoLActionNamingProvider,
      ChicagoLLocoAction,
      ChicagoLPlayerHelper,
      ChicagoLTurnOrderPhase,
      ChicagoLBidAction,
      ChicagoLSelectActionPhase,
      ChicagoLBuildCostCalculator,
      ChicagoLRoundEngine,
      ChicagoLBuildPhase,
    ];
  }

  getModules() {
    return [new EngineerFreeBuildModule()];
  }
}
