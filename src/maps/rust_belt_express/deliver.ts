import { inject } from "../../engine/framework/execution_context";
import { MoveAction, MoveData } from "../../engine/move/move";
import { PlayerData } from "../../engine/state/player";
import { assert } from "../../utils/validate";
import { PlayerHelper } from "../../engine/game/player";
import { MoveValidator } from "../../engine/move/validator";
import { City } from "../../engine/map/city";
import { Action } from "../../engine/state/action";
import { Good } from "../../engine/state/good";
import { Grid } from "../../engine/map/grid";
import { MoveHelper } from "../../engine/move/helper";

export class RustBeltExpressMoveAction extends MoveAction {
  private readonly playerHelper = inject(PlayerHelper);

  process(action: MoveData): boolean {
    const result = super.process(action);

    const grid = this.grid();
    const numSkippedCities = getSkippedCities(grid, this.moveHelper, action);
    if (numSkippedCities > 0) {
      assert(numSkippedCities === 1);
      this.playerHelper.updateCurrentPlayer((player) => {
        assert(player.money >= 2);
        assert(player.selectedAction === Action.FIRST_MOVE);
        player.money -= 2;
      });
      this.log.currentPlayer("pays $2 to skip a city.");
    }

    const endingCity = grid.get(action.path[action.path.length - 1].endingStop);
    assert(endingCity instanceof City);
    if (endingCity.name() === "Pittsburgh" && action.good === Good.BLACK) {
      this.playerHelper.updateCurrentPlayer((player) => {
        player.money += 2;
      });
      this.log.currentPlayer(
        "gets $2 for delivering a black good to Pittsburgh.",
      );
    }

    return result;
  }
}

export class RustBeltExpressMoveValidator extends MoveValidator {
  validate(player: PlayerData, action: MoveData) {
    super.validate(player, action);

    const grid = this.grid();
    const numSkippedCities = getSkippedCities(grid, this.moveHelper, action);
    assert(numSkippedCities <= 1, {
      invalidInput: "Can only skip one city with first move.",
    });
    assert(
      numSkippedCities === 0 ||
        (player.selectedAction === Action.FIRST_MOVE && player.money >= 2),
      {
        invalidInput:
          "Can only skip a city with first move and with $2 cash on hand.",
      },
    );
  }
}

function getSkippedCities(
  grid: Grid,
  moveHelper: MoveHelper,
  action: MoveData,
) {
  let numSkippedCities = 0;
  for (let i = 0; i < action.path.length - 1; i++) {
    const step = action.path[i];
    const city = grid.get(step.endingStop);
    if (city instanceof City && moveHelper.canDeliverTo(city, action.good)) {
      numSkippedCities += 1;
    }
  }
  return numSkippedCities;
}
