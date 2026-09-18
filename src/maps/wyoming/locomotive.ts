import { z } from "zod";
import { injectState } from "../../engine/framework/execution_context";
import { MapKey } from "../../engine/framework/key";
import { MoveData } from "../../engine/move/move";
import { MoveHelper } from "../../engine/move/helper";
import { SelectAction, SelectData } from "../../engine/select_action/select";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { Action } from "../../engine/state/action";
import { PlayerColorZod, PlayerData } from "../../engine/state/player";
import { assert } from "../../utils/validate";

/**
 * In a two player game, players do not permanently upgrade their engine
 * level. Instead, selecting Locomotive costs $2 and grants a loco disc,
 * which can be spent to temporarily extend a delivery beyond the player's
 * current locomotive value.
 */
export const WyomingLocoDiscs = new MapKey(
  "WyomingLocoDiscs",
  PlayerColorZod.parse,
  z.number().parse,
);

export class WyomingSelectAction extends SelectAction {
  private readonly playerCount = injectInitialPlayerCount();
  private readonly locoDiscs = injectState(WyomingLocoDiscs);

  validate(data: SelectData): void {
    super.validate(data);
    if (data.action === Action.LOCOMOTIVE && this.playerCount() === 2) {
      assert(this.currentPlayer().money >= 2, {
        invalidInput: `cannot afford the $2 cost to gain a loco disc`,
      });
    }
  }

  protected applyLocomotive(): void {
    if (this.playerCount() !== 2) {
      super.applyLocomotive();
      return;
    }
    const color = this.currentPlayer().color;
    this.helper.updateCurrentPlayer((player) => {
      player.money -= 2;
    });
    this.locoDiscs.update((discs) => {
      discs.set(color, (discs.get(color) ?? 0) + 1);
    });
    this.log.currentPlayer(`pays $2 to gain a loco disc`);
  }
}

export class WyomingMoveHelper extends MoveHelper {
  private readonly playerCount = injectInitialPlayerCount();
  private readonly locoDiscs = injectState(WyomingLocoDiscs);

  isWithinLocomotive(player: PlayerData, moveData: MoveData): boolean {
    if (this.playerCount() !== 2) {
      return super.isWithinLocomotive(player, moveData);
    }
    const bonusLocoDiscs = this.locoDiscs().get(player.color) ?? 0;
    return moveData.path.length <= this.getLocomotive(player) + bonusLocoDiscs;
  }
}
