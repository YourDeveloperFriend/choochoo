import { inject } from "../../engine/framework/execution_context";
import { Log } from "../../engine/game/log";
import { MoneyManager } from "../../engine/game/money_manager";
import { Random } from "../../engine/game/random";
import { injectPlayersByTurnOrder } from "../../engine/game/state";
import { IncomePhase } from "../../engine/income_and_expenses/income";

export class IndiaSteamBrothersIncomePhase extends IncomePhase {
  private readonly random = inject(Random);
  private readonly log = inject(Log);
  private readonly moneyManager = inject(MoneyManager);
  private readonly players = injectPlayersByTurnOrder();

  onStart(): void {
    this.handleMonsoon();
    return super.onStart();
  }

  private handleMonsoon(): void {
    const cost = this.monsoonCost();
    if (cost === 0) {
      return;
    }

    for (const player of this.players()) {
      const result = this.moneyManager.addMoney(
        player.color,
        cost,
        /* forced= */ true,
      );
      if (result.lostIncome > 0) {
        this.log.player(
          player,
          `cannot afford monsoon expenses, loses ${result.lostIncome} income`,
        );

        if (result.outOfGame) {
          this.log.player(player, "drops out of the game");
        }
      }
    }
  }

  private monsoonCost(): number {
    switch (this.random.rollDie()) {
      case 1:
        this.log.log("No monsoon expenses this round.");
        return 0;
      case 6:
        this.log.log("Heavy monsoon season, every player pays $2");
        return -2;
      default:
        this.log.log("Light monsoon season, every player pays $2");
        return -1;
    }
  }
}
