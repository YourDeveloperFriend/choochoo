import { inject } from "../framework/execution_context";
import { Log } from "../game/log";
import { PhaseModule } from "../game/phase_module";
import { injectAllPlayersUnsafe } from "../game/state";
import { Phase } from "../state/phase";
import { PlayerColor } from "../state/player";

export class IncomeReductionPhase extends PhaseModule {
  static readonly phase = Phase.INCOME_REDUCTION;

  private readonly log = inject(Log);
  private readonly players = injectAllPlayersUnsafe();

  onStart(): void {
    let hasLoggedIncomeReduction = false;
    this.players.update((players) => {
      for (const player of players) {
        if (player.outOfGame) continue;
        const lostIncome = this.calculateIncomeReduction(player.income);
        player.income -= lostIncome;
        if (lostIncome > 0) {
          if (!hasLoggedIncomeReduction) {
            hasLoggedIncomeReduction = true;
            this.log.log("Begin income reduction");
          }
          this.log.player(player, `loses ${lostIncome} income`);
        }
      }
    });
    super.onStart();
  }

  protected calculateIncomeReduction(income: number): number {
    if (income <= 10) return 0;
    if (income >= 50) return 10;
    return Math.floor((income - 1) / 10) * 2;
  }

  getPlayerOrder(): PlayerColor[] {
    return [];
  }
}
