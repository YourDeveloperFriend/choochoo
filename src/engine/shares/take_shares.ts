import { z } from "zod";
import { assert } from "../../utils/validate";
import { inject } from "../framework/execution_context";
import { ActionProcessor } from "../game/action";
import { Log } from "../game/log";
import { PlayerHelper } from "../game/player";
import { ShareHelper } from "./share_helper";

export const TakeSharesData = z.object({
  numShares: z.number(),
});

export type TakeSharesData = z.infer<typeof TakeSharesData>;

export class TakeSharesAction implements ActionProcessor<TakeSharesData> {
  static readonly action = "takeShares";
  readonly assertInput = TakeSharesData.parse;

  protected readonly log = inject(Log);
  protected readonly playerHelper = inject(PlayerHelper);
  protected readonly helper = inject(ShareHelper);

  validate(data: TakeSharesData) {
    assert(data.numShares <= this.helper.getSharesTheyCanTake(), {
      invalidInput: `cannot take more than ${this.helper.getMaxShares()} shares`,
    });
  }

  process({ numShares }: TakeSharesData): boolean {
    if (this.helper.getSharesTheyCanTake() === 0) {
      this.log.currentPlayer(`cannot take out anymore shares`);
    } else if (numShares === 0) {
      this.log.currentPlayer("does not take out any shares");
    } else {
      this.log.currentPlayer(
        `takes out ${numShares} shares and receives $${5 * numShares}`,
      );
    }

    this.playerHelper.updateCurrentPlayer((player) => {
      player.shares += numShares;
      player.money += 5 * numShares;
    });

    return true;
  }
}
