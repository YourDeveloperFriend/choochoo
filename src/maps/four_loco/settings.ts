import {
  CHAD_DESHON,
  KAOSKODY,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { TurnLengthModule } from "../../modules/turn_length";
import { map } from "./grid";
import { FourLocoAllowedActions, FourLocoLocoAction } from "./actions";
import {
  FourLocoMoveAction,
  FourLocoMovePassAction,
  FourLocoMovePhase,
  FourLocoMoveValidator,
} from "./deliver";
import {
  FourLocoExpensesPhase,
  FourLocoProfitHelper,
  FourLocoTakeSharesAction,
} from "./expenses";
import { FourLocoStarter } from "./starter";

/**
 * 4 Loco Map Settings
 *
 * Custom rules:
 * - All players start at engine level 4 (no Locomotive action)
 * - Exactly 4 links required per delivery
 * - Players may only use their own track for deliveries
 * - Delivery phase continues until all players pass consecutively
 *   (once a player passes, they are out until someone delivers, resetting passes)
 * - Each delivery always awards exactly 2 income
 * - Engine level does NOT count toward expenses
 * - All shares cost $3 (both voluntary share phase and forced emergency shares)
 * - Forced shares issued when player cannot afford expenses (up to share limit)
 * - Turn count: 2p→10, 3p→8, 4p→7, 5p→6, 6p→5
 */
export class FourLocoMapSettings implements MapSettings {
  readonly key = "four-loco";
  readonly name = "4 Loco";
  readonly designer = "Chad DeShon";
  readonly implementerId = CHAD_DESHON;
  readonly minPlayers = 2;
  readonly maxPlayers = 6;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_RECOMMENDED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.HIGHLY_RECOMMENDED,
    5: PlayerCountRating.RECOMMENDED,
    6: PlayerCountRating.NOT_RECOMMENDED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;
  readonly developmentAllowlist = [KAOSKODY, CHAD_DESHON];

  getOverrides() {
    return [
      FourLocoStarter,
      FourLocoMovePhase,
      FourLocoMoveAction,
      FourLocoMovePassAction,
      FourLocoMoveValidator,
      FourLocoLocoAction,
      FourLocoProfitHelper,
      FourLocoExpensesPhase,
      FourLocoTakeSharesAction,
      FourLocoAllowedActions,
    ];
  }

  getModules(): Array<Module> {
    return [
      new TurnLengthModule({
        function: (playerCount: number) => {
          if (playerCount === 2) return 10;
          if (playerCount === 3) return 8;
          if (playerCount === 4) return 7;
          if (playerCount === 5) return 6;
          return 5; // 6+ players
        },
      }),
    ];
  }
}
