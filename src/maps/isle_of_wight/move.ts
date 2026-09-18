import { z } from "zod";
import { inject } from "../../engine/framework/execution_context";
import { injectCurrentPlayer } from "../../engine/game/state";
import { MoveHelper } from "../../engine/move/helper";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MovePassAction } from "../../engine/move/pass";
import { MovePhase } from "../../engine/move/phase";
import { PlayerData } from "../../engine/state/player";
import { assert } from "../../utils/validate";
import { WorkInFactoriesAction } from "./factory";
import { describeTrain, nextRange } from "./train_data";
import { TrainHelper } from "./trains";

export const IsleOfWightMoveData = MoveData.extend({
  trainIndex: z.number().min(0),
});
export type IsleOfWightMoveData = z.infer<typeof IsleOfWightMoveData>;

export class IsleOfWightMoveHelper extends MoveHelper {
  private readonly trainHelper = inject(TrainHelper);

  getLocomotive(player: PlayerData): number {
    return this.trainHelper.maxRange(player.color);
  }

  getLocomotiveDisplay(player: PlayerData): string {
    const ranges = this.trainHelper
      .deliverableTrains(player.color)
      .map(({ card }) => nextRange(card)!);
    return ranges.length === 0 ? "0" : ranges.join(" or ");
  }

  isWithinLocomotive(player: PlayerData, moveData: MoveData): boolean {
    const { trainIndex } = moveData as IsleOfWightMoveData;
    if (trainIndex == null) {
      return false;
    }
    const range = this.rangeOf(player, trainIndex);
    return range != null && moveData.path.length <= range;
  }

  /** The range of one of a player's trains, or undefined if it cannot haul. */
  rangeOf(player: PlayerData, trainIndex: number): number | undefined {
    const card = this.trainHelper.trainsFor(player.color)[trainIndex];
    if (card == null || card.used) return undefined;
    return nextRange(card);
  }
}

export class IsleOfWightMoveAction extends MoveAction<IsleOfWightMoveData> {
  private readonly trainHelper = inject(TrainHelper);

  assertInput(data: unknown): IsleOfWightMoveData {
    return IsleOfWightMoveData.parse(data);
  }

  validate(action: IsleOfWightMoveData): void {
    super.validate(action);
    const player = this.currentPlayer();
    assert(action.trainIndex != null, {
      invalidInput: "no train selected for delivery",
    });
    const card = this.trainHelper.trainsFor(player.color)[action.trainIndex];
    assert(card != null, {
      invalidInput: `no train at position ${action.trainIndex + 1}`,
    });
    assert(!card.used, {
      invalidInput: "that train's crew is already on a break this turn",
    });
    assert(nextRange(card) != null, {
      invalidInput: "that train has no space left for a good",
    });
  }

  process(action: IsleOfWightMoveData): boolean {
    const player = this.currentPlayer();
    const card = this.trainHelper.trainsFor(player.color)[action.trainIndex];
    this.log.currentPlayer(`hauls the good with their ${describeTrain(card)}`);
    return super.process(action);
  }

  /** The delivered cube rides on the train rather than returning to the bag. */
  protected returnToBag(action: IsleOfWightMoveData): void {
    this.trainHelper.useTrain(
      this.currentPlayer().color,
      action.trainIndex,
      action.good,
    );
  }
}

export class IsleOfWightMovePhase extends MovePhase {
  private readonly currentPlayerData = injectCurrentPlayer();
  private readonly trainHelper = inject(TrainHelper);

  configureActions(): void {
    // LocoAction is intentionally not installed: range comes from the trains.
    this.installAction(MoveAction);
    this.installAction(MovePassAction);
    this.installAction(WorkInFactoriesAction);
  }

  onStart(): void {
    super.onStart();
    // Every crew is back from their break at the start of the Ship step.
    this.trainHelper.resetUsed();
  }

  checkSkipTurn(): boolean {
    // Without an unused train there is nothing a player can do, not even send
    // a crew to work in the factories.
    return (
      this.trainHelper.unusedTrains(this.currentPlayerData().color).length === 0
    );
  }

  protected getAutoAction(): undefined {
    // The locomotive auto-action does not apply on this map.
    return undefined;
  }
}
