import { inject } from "../../engine/framework/execution_context";
import { EmptyActionProcessor } from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { PlayerHelper } from "../../engine/game/player";
import { ShareHelper } from "../../engine/shares/share_helper";
import { TakeSharesAction } from "../../engine/shares/take_shares";
import { PlayerData } from "../../engine/state/player";
import { assert } from "../../utils/validate";

export class NwIndianaTakeSharesAction extends TakeSharesAction {
  calculateMoneyForAdditionalShares(
    player: PlayerData,
    numShares: number,
  ): number {
    let money = 0;
    for (
      let share = player.shares + 1;
      share <= player.shares + numShares;
      share++
    ) {
      if (share <= 5) {
        money += 5;
      } else if (share <= 10) {
        money += 6;
      } else {
        money += 7;
      }
    }
    return money;
  }
}

/**
 * Lets a player issue a single additional share for $4 at any time during an
 * interactive phase, outside of the normal issue-shares action.
 */
export class NwIndianaIssueShareForMoneyAction extends EmptyActionProcessor {
  static readonly action = "nw-indiana-issue-share-for-money";

  private readonly shareHelper = inject(ShareHelper);
  private readonly playerHelper = inject(PlayerHelper);
  private readonly log = inject(Log);

  validate(): void {
    super.validate();
    assert(this.shareHelper.getSharesTheyCanTake() >= 1, {
      invalidInput: "Cannot issue a share when at the max number of shares.",
    });
  }

  process(): boolean {
    this.playerHelper.updateCurrentPlayer((player) => {
      player.shares += 1;
      player.money += 4;
    });
    this.log.currentPlayer("issues a share for $4");
    return false;
  }
}
