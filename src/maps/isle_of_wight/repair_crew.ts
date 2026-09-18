import { z } from "zod";
import { inject } from "../../engine/framework/execution_context";
import { ActionProcessor } from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Action } from "../../engine/state/action";
import { assert } from "../../utils/validate";
import { TrainHelper } from "./trains";

export const MAX_REPAIRS = 2;

export const RepairCrewData = z.object({
  // Array of train indices.
  removals: z.array(z.number().min(0)).min(0).max(MAX_REPAIRS),
});
export type RepairCrewData = z.infer<typeof RepairCrewData>;

export class RepairCrewAction implements ActionProcessor<RepairCrewData> {
  static readonly action = "repairCrew";
  readonly assertInput = RepairCrewData.parse;

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly trainHelper = inject(TrainHelper);
  private readonly log = inject(Log);

  canEmit(): boolean {
    return this.currentPlayer().selectedAction === Action.REPAIR_CREW;
  }

  validate({ removals }: RepairCrewData): void {
    const trains = this.trainHelper.trainsFor(this.currentPlayer().color);
    assert(removals.length <= MAX_REPAIRS, {
      invalidInput: `at most two goods can be removed by the train removal action`,
    });
    const removalPerTrain: Map<number, number> = new Map();
    for (const trainIndex of removals) {
      removalPerTrain.set(
        trainIndex,
        (removalPerTrain.get(trainIndex) ?? 0) + 1,
      );
    }

    for (const [trainIndex, removalCount] of removalPerTrain) {
      const card = trains[trainIndex];
      assert(card != null, {
        invalidInput: `no train at position ${trainIndex + 1}`,
      });
      assert(card.goods.length >= removalCount, {
        invalidInput: `no good on train at position ${trainIndex + 1}`,
      });
    }
  }

  process({ removals }: RepairCrewData): boolean {
    if (removals.length === 0) {
      this.log.currentPlayer("does not remove any goods from their trains");
      return true;
    }

    const color = this.currentPlayer().color;
    for (const removal of removals) {
      this.trainHelper.removeGood(color, removal);
    }
    this.log.currentPlayer(
      `repairs their trains, removing ${removals.length} goods`,
    );
    return true;
  }
}
