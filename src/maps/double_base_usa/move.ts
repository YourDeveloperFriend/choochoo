import { MovePhase } from "../../engine/move/phase";
import { ActionBundle } from "../../engine/game/phase_module";
import { inject, injectState } from "../../engine/framework/execution_context";
import { DoubleBaseUsaPlayerData } from "./starter";
import { injectCurrentPlayer } from "../../engine/game/state";
import { MovePassAction } from "../../engine/move/pass";
import { Log } from "../../engine/game/log";
import { MOVE_STATE } from "../../engine/move/state";
import { assert } from "../../utils/validate";
import { MoveAction, MoveData } from "../../engine/move/move";
import { DoubleBaseUsaDoubleLocoAction } from "./loco";
import { PlayerData } from "../../engine/state/player";
import { MoveHelper } from "../../engine/move/helper";

export class DoubleBaseUsaMovePhase extends MovePhase {
  private readonly playerData = injectState(DoubleBaseUsaPlayerData);
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly log = inject(Log);

  configureActions() {
    super.configureActions();
    this.installAction(DoubleBaseUsaDoubleLocoAction);
  }

  numMoveRounds(): number {
    return 3;
  }

  forcedAction(): ActionBundle<object> | undefined {
    if (
      this.moveState().moveRound === 2 &&
      this.playerData().get(this.currentPlayer().color)!.landGrants < 3
    ) {
      this.log.currentPlayer(
        "does not have enough land grants for a third delivery and auto-passes",
      );
      return { action: MovePassAction, data: {} };
    }
    return undefined;
  }
}

export class DoubleBaseUsaMoveHelper extends MoveHelper {
  private readonly playerData = injectState(DoubleBaseUsaPlayerData);

  isWithinLocomotive(player: PlayerData, moveData: MoveData): boolean {
    const bonusLocoDiscs = this.playerData().get(player.color)!.locoDiscs;
    return moveData.path.length <= this.getLocomotive(player) + bonusLocoDiscs;
  }
}

export class DoubleBaseUsaMoveAction extends MoveAction {
  private readonly moveState = injectState(MOVE_STATE);
  private readonly playerData = injectState(DoubleBaseUsaPlayerData);

  validate(action: MoveData) {
    super.validate(action);
    assert(
      this.moveState().moveRound !== 2 ||
        this.playerData().get(this.currentPlayer().color)!.landGrants >= 3,
      { invalidInput: "must have 3 land grants to do a third delivery action" },
    );
    const excessLoco =
      action.path.length - this.moveHelper.getLocomotive(this.currentPlayer());
    assert(
      excessLoco <=
        this.playerData().get(this.currentPlayer().color)!.locoDiscs,
      {
        invalidInput:
          "not enough loco (including use of bonus discs) to complete this delivery",
      },
    );
  }

  process(action: MoveData): boolean {
    const result = super.process(action);

    const currentPlayer = this.currentPlayer();

    const excessLoco =
      action.path.length - this.moveHelper.getLocomotive(currentPlayer);
    if (excessLoco > 0) {
      this.playerData.update((playerData) => {
        playerData.get(currentPlayer.color)!.locoDiscs -= excessLoco;
      });
      this.log.currentPlayer(`spends ${excessLoco} bonus loco discs`);
    }

    if (this.moveState().moveRound === 2) {
      this.playerData.update((playerData) => {
        playerData.get(currentPlayer.color)!.landGrants -= 3;
      });
      this.log.currentPlayer(`spends 3 land grants to do an extra delivery`);
    }

    return result;
  }
}
