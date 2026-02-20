import { MoveData } from "../../engine/move/move";
import { PlayerData } from "../../engine/state/player";
import { assert } from "../../utils/validate";
import { MoveValidator } from "../../engine/move/validator";
import { City } from "../../engine/map/city";
import { Action } from "../../engine/state/action";
import { Grid } from "../../engine/map/grid";
import { MoveHelper } from "../../engine/move/helper";

export class EasternUsAndCanadaMoveValidator extends MoveValidator {
  validate(player: PlayerData, action: MoveData) {
    super.validate(player, action);

    const grid = this.grid();
    const numSkippedCities = getSkippedCities(grid, this.moveHelper, action);
    assert(numSkippedCities <= 1, {
      invalidInput: "Can only skip one city with marketing.",
    });
    assert(
      numSkippedCities === 0 || player.selectedAction === Action.MARKETING,
      {
        invalidInput: "Can only skip a city with marketing.",
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
