import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  ReleaseStage,
  Rotation,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import {
  RustBeltExpressBuildCostCalculator,
  RustBeltExpressBuilderHelper,
} from "./build";
import { RustBeltExpressUrbanizeAction } from "./urbanize";
import { RustBeltExpressMoveHelper } from "./move";
import { RustBeltExpressAllowedActions } from "./allowed_actions";
import { Module } from "../../engine/module/module";
import { TurnLengthModule } from "../../modules/turn_length";
import { RustBeltExpressPhaseEngine } from "./phases";
import {
  RustBeltExpressMoveAction,
  RustBeltExpressMoveValidator,
} from "./deliver";
import { RustBeltExpressStarter } from "./starter";
import { fail } from "../../utils/validate";
import { interCityConnections } from "../factory";

export class RustBeltExpressMapSettings implements MapSettings {
  readonly key = GameKey.RUST_BELT_EXPRESS;
  readonly name = "Rust Belt Express";
  readonly designer = "Kevin McCurdy";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 4;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;
  readonly rotation = Rotation.CLOCKWISE;
  readonly interCityConnections = interCityConnections(map, [
    {
      connects: ["Toronto", "Buffalo"],
      cost: 3,
    },
  ]);

  getOverrides() {
    return [
      RustBeltExpressBuildCostCalculator,
      RustBeltExpressUrbanizeAction,
      RustBeltExpressAllowedActions,
      RustBeltExpressPhaseEngine,
      RustBeltExpressMoveHelper,
      RustBeltExpressMoveAction,
      RustBeltExpressMoveValidator,
      RustBeltExpressStarter,
      RustBeltExpressBuilderHelper,
    ];
  }

  getModules(): Array<Module> {
    return [
      new TurnLengthModule({
        function: (playerCount: number): number => {
          if (playerCount === 3) {
            return 6;
          }
          if (playerCount === 4) {
            return 5;
          }
          fail("Unsupported player count: " + playerCount);
        },
      }),
    ];
  }
}
