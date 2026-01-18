import { MoveAction, MoveData } from "../../engine/move/move";
import { City } from "../../engine/map/city";
import { THE_LOOP_SAME_CITY } from "./grid";
import { PlayerHelper } from "../../engine/game/player";
import { inject, injectState } from "../../engine/framework/execution_context";
import { PlayerColor } from "../../engine/state/player";
import { GOVERNMENT_COLOR, GOVERNMENT_ENGINE_LEVEL } from "./starter";
import { assert } from "../../utils/validate";

export class ChicagoLMoveAction extends MoveAction {
  private readonly playerHelper = inject(PlayerHelper);
  private readonly govtEngineLevel = injectState(GOVERNMENT_ENGINE_LEVEL);

  calculateIncome(action: MoveData): Map<PlayerColor | undefined, number> {
    const currentPlayer = this.currentPlayer().color;
    const baseIncome = super.calculateIncome(action);
    const playerGovtEngineLevel = this.govtEngineLevel().get(currentPlayer);
    assert(playerGovtEngineLevel !== undefined);
    const govtLocoMaxIncome = Math.floor((playerGovtEngineLevel + 1) / 2);
    const govtIncome = Math.min(
      govtLocoMaxIncome,
      baseIncome.get(GOVERNMENT_COLOR) || 0,
    );
    baseIncome.set(
      currentPlayer,
      (baseIncome.get(currentPlayer) || 0) + govtIncome,
    );
    baseIncome.delete(GOVERNMENT_COLOR);
    return baseIncome;
  }

  process(action: MoveData): boolean {
    const result = super.process(action);

    const destination = this.grid().get(
      action.path[action.path.length - 1].endingStop,
    );
    if (
      destination instanceof City &&
      destination.data.sameCity === THE_LOOP_SAME_CITY
    ) {
      this.log.currentPlayer("gets a bonus $3 for delivering to The Loop");
      this.playerHelper.updateCurrentPlayer((player) => {
        player.money += 3;
      });
    }

    return result;
  }
}
