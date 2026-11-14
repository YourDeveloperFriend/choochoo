import { WAGGLE_DANCE_PHASE } from "./phases";
import { WAGGLE_DANCE, DOMINANT_WORKER_BEE } from "./actions";
import { OrderedSet } from "immutable";
import {
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
  Rotation,
} from "../../engine/game/map_settings";
import { RoundEngine } from "../../engine/game/round";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { PhasesModule } from "../../modules/phases";
import { map } from "./grid";
import {
  HONEYBEE_HIVE_MIND_KEY,
  HONEYBEE_HIVE_MIND_IMPLEMENTER_ID,
} from "./identity";
import { HoneybeeStarter } from "./starter";
import { HoneybeeActionNamingProvider } from "./actions";
import { HoneybeePhaseNamingProvider } from "./phases";
import {
  HoneybeeBuildAction,
  HoneybeeBuildPhase,
  HoneybeeClaimAction,
  HoneybeeConnectAction,
  connectionsForPlayers,
} from "./connections";
import {
  HoneybeeMoveAction,
  HoneybeeMoveInterceptor,
  HoneybeeMoveValidator,
} from "./move";
import { WagglePhase } from "./waggle";

class HoneybeeRoundEngine extends RoundEngine {
  maxRounds(): number {
    return super.maxRounds() - 1;
  }
}
class HoneybeeAllowedActions extends AllowedActions {
  getActions() {
    return OrderedSet([
      Action.FIRST_MOVE,
      Action.FIRST_BUILD,
      Action.ENGINEER,
      Action.LOCOMOTIVE,
      Action.URBANIZATION,
      WAGGLE_DANCE,
      DOMINANT_WORKER_BEE,
      Action.PRODUCTION,
      Action.TURN_ORDER_PASS,
    ]);
  }
}

export class HoneybeeHiveMindMapSettings implements MapSettings {
  readonly key = HONEYBEE_HIVE_MIND_KEY;
  readonly name = "Honeybee Hive Mind";
  readonly designer = "Joshua Acosta, MD";
  readonly implementerId = HONEYBEE_HIVE_MIND_IMPLEMENTER_ID;
  readonly minPlayers = 3;
  readonly maxPlayers = 5;
  readonly playerCountRatings = {
    3: PlayerCountRating.HIGHLY_RECOMMENDED,
    4: PlayerCountRating.HIGHLY_RECOMMENDED,
    5: PlayerCountRating.RECOMMENDED,
  };
  readonly startingGrid = map;
  readonly interCityConnections = connectionsForPlayers(3);
  readonly stage = ReleaseStage.PRODUCTION;
  readonly rotation = Rotation.CLOCKWISE;
  getOverrides() {
    return [
      HoneybeeStarter,
      HoneybeeRoundEngine,
      HoneybeeAllowedActions,
      HoneybeeActionNamingProvider,
      HoneybeePhaseNamingProvider,
      HoneybeeBuildAction,
      HoneybeeBuildPhase,
      HoneybeeClaimAction,
      HoneybeeConnectAction,
      HoneybeeMoveAction,
      HoneybeeMoveValidator,
      HoneybeeMoveInterceptor,
    ];
  }
  getModules() {
    return [
      new PhasesModule({
        newPhases: [WagglePhase],
        replace: (phases) =>
          phases.flatMap((phase) =>
            phase === Phase.MOVING ? [WAGGLE_DANCE_PHASE, phase] : [phase],
          ),
      }),
    ];
  }
}
