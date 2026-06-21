import { z } from "zod";
import { remove } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../../engine/framework/execution_context";
import {
  ActionProcessor,
  EmptyActionProcessor,
} from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { MoneyManager } from "../../engine/game/money_manager";
import { ActionBundle, PhaseModule } from "../../engine/game/phase_module";
import { ROUND } from "../../engine/game/round";
import {
  injectCurrentPlayer,
  injectPlayerAction,
} from "../../engine/game/state";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { StalinistRussiaLocoHelper } from "./loco_helper";
import { LOCO_TRACK } from "./state";
import {
  costToAdvanceInto,
  describeBox,
  LocoRow,
  LocoRowZod,
  MAX_LOCO_BOX,
} from "./track_data";

export class StalinistRussiaLocomotivePhase extends PhaseModule {
  static readonly phase = Phase.STALINIST_LOCOMOTIVE;

  private readonly locoPlayer = injectPlayerAction(Action.LOCOMOTIVE);
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly round = injectState(ROUND);
  private readonly locoHelper = inject(StalinistRussiaLocoHelper);

  configureActions(): void {
    this.installAction(LocoAdvanceAction);
    this.installAction(LocoSkipAction);
  }

  getPlayerOrder(): PlayerColor[] {
    const playerOrder = super.getPlayerOrder();
    const locoPlayer = this.locoPlayer();
    if (locoPlayer != null) {
      return [locoPlayer.color, ...remove(playerOrder, locoPlayer.color)];
    }
    return playerOrder;
  }

  forcedAction(): ActionBundle<object> | undefined {
    const player = this.currentPlayer();
    const { box } = this.locoHelper.getPosition(player.color);
    const targetBox = box + 1;
    const canAdvance =
      box < MAX_LOCO_BOX &&
      targetBox <= this.round() &&
      player.money >= costToAdvanceInto(targetBox);
    if (!canAdvance) {
      return { action: LocoSkipAction, data: {} };
    }
    return undefined;
  }
}

export const LocoAdvanceData = z.object({
  targetBox: z.number(),
  row: LocoRowZod,
});
export type LocoAdvanceData = z.infer<typeof LocoAdvanceData>;

export class LocoAdvanceAction implements ActionProcessor<LocoAdvanceData> {
  static readonly action = "locoAdvance";

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly round = injectState(ROUND);
  private readonly locoTrack = injectState(LOCO_TRACK);
  private readonly locoHelper = inject(StalinistRussiaLocoHelper);
  private readonly moneyManager = inject(MoneyManager);
  private readonly log = inject(Log);

  readonly assertInput = LocoAdvanceData.parse;

  canEmit(): boolean {
    return true;
  }

  validate({ targetBox, row }: LocoAdvanceData): void {
    const player = this.currentPlayer();
    const { box } = this.locoHelper.getPosition(player.color);

    // A player may advance any number of boxes forward on the track.
    assert(targetBox > box, {
      invalidInput: "must advance forward on the locomotive track",
    });
    assert(targetBox <= MAX_LOCO_BOX, {
      invalidInput: "beyond the end of the locomotive track",
    });
    assert(targetBox <= this.round(), {
      invalidInput: "cannot advance beyond the current round",
    });

    // Regardless of current position, the cost is the destination column's cost.
    const cost = costToAdvanceInto(targetBox);
    assert(player.money >= cost, {
      invalidInput: `cannot afford to advance (costs $${cost})`,
    });

    if (row === LocoRow.SINGLE) {
      const occupied = [...this.locoTrack().values()].some(
        (pos) => pos.row === LocoRow.SINGLE && pos.box === targetBox,
      );
      assert(!occupied, {
        invalidInput: "another player already occupies that single-player box",
      });
    }
  }

  process({ targetBox, row }: LocoAdvanceData): boolean {
    const player = this.currentPlayer();
    const cost = costToAdvanceInto(targetBox);

    this.moneyManager.addMoney(player.color, -cost);
    this.locoTrack.update((track) => {
      track.set(player.color, { box: targetBox, row });
    });
    this.log.currentPlayer(
      `pays $${cost} to advance to ${describeBox(targetBox, row)} on the locomotive track`,
    );
    return true;
  }
}

export class LocoSkipAction extends EmptyActionProcessor {
  static readonly action = "locoSkip";

  private readonly log = inject(Log);

  process(): boolean {
    this.log.currentPlayer("does not advance on the locomotive track");
    return true;
  }
}
