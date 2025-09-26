import { BuildCostCalculator } from "../../engine/build/cost";
import { Coordinates } from "../../utils/coordinates";
import { Direction, TileType } from "../../engine/state/tile";
import { BuilderHelper } from "../../engine/build/helper";
import { Action } from "../../engine/state/action";
import { injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";

export class RustBeltExpressBuildCostCalculator extends BuildCostCalculator {
  costOf(
    _coordinates: Coordinates,
    _newTileType: TileType,
    _orientation: Direction,
  ): number {
    return 3;
  }
}

export class RustBeltExpressBuilderHelper extends BuilderHelper {
  private readonly currentRound = injectState(ROUND);

  getMaxBuilds(): number {
    const baseMaxBuilds = this.currentRound() === 1 ? 2 : 3;
    return (
      baseMaxBuilds +
      (this.currentPlayer().selectedAction === Action.ENGINEER ? 1 : 0)
    );
  }
}
