import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { RoundEngine } from "../../engine/game/round";
import { ScotlandClaimAction } from "./ferries";
import { ClaimRequiresUrbanizeModule } from "../../modules/claim_requires_urbanize";
import { map } from "./grid";

export class ScotlandMapSettings implements MapSettings {
  readonly key = GameKey.SCOTLAND;
  readonly name = "Scotland";
  readonly minPlayers = 2;
  readonly maxPlayers = 2;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;

  getOverrides() {
    return [
      ScotlandRoundEngine,
      ScotlandClaimAction,
    ];
  }

  getModules(): Array<Module> {
      return [
        new ClaimRequiresUrbanizeModule(),
      ];
  }
}

export class ScotlandRoundEngine extends RoundEngine {

  maxRounds(): number {
    return 8;
  }
}