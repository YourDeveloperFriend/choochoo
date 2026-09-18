import { z } from "zod";
import { inject } from "../../engine/framework/execution_context";
import {
  ActionProcessor,
  EmptyActionProcessor,
} from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { ActionBundle, PhaseModule } from "../../engine/game/phase_module";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { assert } from "../../utils/validate";
import { TrainHelper } from "./trains";

/** The Scrap step: in reverse order, players may discard their trains. */
export class IsleOfWightScrapPhase extends PhaseModule {
  static readonly phase = Phase.SCRAP;

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly trainHelper = inject(TrainHelper);

  configureActions(): void {
    this.installAction(ScrapAction);
    this.installAction(ScrapPassAction);
  }

  getPlayerOrder(): PlayerColor[] {
    return [...super.getPlayerOrder()].reverse();
  }

  forcedAction(): ActionBundle<object> | undefined {
    if (this.trainHelper.trainsFor(this.currentPlayer().color).length === 0) {
      return { action: ScrapPassAction, data: {} };
    }
    return undefined;
  }
}

export const ScrapData = z.object({
  // Indexes into the player's trains, as displayed.
  trainIndex: z.number().min(0),
});
export type ScrapData = z.infer<typeof ScrapData>;

export class ScrapAction implements ActionProcessor<ScrapData> {
  static readonly action = "scrapTrains";
  readonly assertInput = ScrapData.parse;

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly trainHelper = inject(TrainHelper);
  private readonly log = inject(Log);

  canEmit(): boolean {
    return true;
  }

  validate({ trainIndex }: ScrapData): void {
    const trains = this.trainHelper.trainsFor(this.currentPlayer().color);
    assert(trains[trainIndex] != null, {
      invalidInput: `no train at position ${trainIndex + 1}`,
    });
  }

  process({ trainIndex }: ScrapData): boolean {
    const color = this.currentPlayer().color;
    const card = this.trainHelper.scrap(color, trainIndex);
    const goodsStr =
      card.goods.length === 0
        ? ""
        : `, returning ${card.goods.length} good${card.goods.length === 1 ? "" : "s"} to the bag`;
    this.log.currentPlayer(`scraps a ${card.tier}-train${goodsStr}`);
    return false;
  }
}

export class ScrapPassAction extends EmptyActionProcessor {
  static readonly action = "scrapPass";

  private readonly log = inject(Log);

  process(): boolean {
    this.log.currentPlayer("does not scrap any trains");
    return true;
  }
}
