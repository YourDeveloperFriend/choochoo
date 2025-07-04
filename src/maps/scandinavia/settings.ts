import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  Rotation,
} from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { Action } from "../../engine/state/action";
import { AvailableActionsModule } from "../../modules/available_actions";
import { ClaimRequiresUrbanizeModule } from "../../modules/claim_requires_urbanize";
import { TurnLengthModule } from "../../modules/turn_length";
import {
  ScandinaviaMoveAction,
  ScandinaviaMoveHelper,
  ScandinaviaMovePhase,
  ScandinaviaMoveValidator,
} from "./ferry";
import { map } from "./grid";
import { ScandinaviaBuildPhase, ScandinaviaClaimAction } from "./claim_once";

export class ScandinaviaMapSettings implements MapSettings {
  readonly key = GameKey.SCANDINAVIA;
  readonly name = "Scandinavia";
  readonly designer = "Martin Wallace";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 3;
  readonly maxPlayers = 4;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;
  readonly rotation = Rotation.CLOCKWISE;

  getOverrides() {
    return [
      ScandinaviaMoveValidator,
      ScandinaviaMoveHelper,
      ScandinaviaMoveAction,
      ScandinaviaMovePhase,
      ScandinaviaClaimAction,
      ScandinaviaBuildPhase,
    ];
  }

  getModules(): Array<Module> {
    return [
      new AvailableActionsModule({ add: [Action.FERRY] }),
      new ClaimRequiresUrbanizeModule(),
      new TurnLengthModule({ add: -1 }),
    ];
  }
}
