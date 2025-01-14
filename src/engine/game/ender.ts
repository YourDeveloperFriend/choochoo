import { inject, injectState } from "../framework/execution_context";
import { GridHelper } from "../map/grid_helper";
import { Phase } from "../state/phase";
import { Log } from "./log";
import { PHASE } from "./phase";
import { PlayerHelper } from "./player";
import { injectGrid } from "./state";

export enum EndGameReason {
  PLAYERS_ELIMINATED,
  ROUNDS_ENDED,
}

/** This gets run at the end of the game. */
export class Ender {
  private readonly grid = injectGrid();
  private readonly gridHelper = inject(GridHelper);
  private readonly phase = injectState(PHASE);
  private readonly log = inject(Log);
  private readonly playerHelper = inject(PlayerHelper);

  protected logEndGame(reason: EndGameReason) {
    switch (reason) {
      case EndGameReason.PLAYERS_ELIMINATED:
        if (this.playerHelper.isSoloGame()) {
          this.log.log('You lose! Better luck next time.');
        } else if (this.playerHelper.getPlayersRemaining() === 0) {
          this.log.log('All players lose, no winner!');
        } else {
          this.log.log('Only one player remaining, game over.');
        }
        return;

      case EndGameReason.ROUNDS_ENDED:
        this.log.log('Game over.');
    }
  }

  endGame(reason: EndGameReason): void {
    this.phase.initState(Phase.END_GAME);
    this.onEndGame();

    this.logEndGame(reason);
    const danglers = this.grid().getDanglers();
    for (const dangler of danglers) {
      this.gridHelper.setRouteOwner(dangler, undefined);
    }
  }

  protected onEndGame() { }
}