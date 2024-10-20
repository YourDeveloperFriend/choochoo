import { inject, injectState } from "../framework/execution_context";
import { PhaseEngine, PhaseModule } from "../game/phase";
import { PLAYERS } from "../game/state";
import { Phase } from "../state/phase";
import { PlayerColor } from "../state/player";

export class IncomePhase extends PhaseModule {
  static readonly phase = Phase.INCOME;

  onStart(): void {
    injectState(PLAYERS).update((players) => {
      for (const player of players) {
        if (player.outOfGame) continue;
        player.money += player.income;
      }
    });
    super.onStart();
  }

  getPlayerOrder(): PlayerColor[] {
    return [];
  }
}