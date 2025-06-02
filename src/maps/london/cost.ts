import { BuildCostCalculator } from "../../engine/build/cost";
import { injectState } from "../../engine/framework/execution_context";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Action } from "../../engine/state/action";
import { Direction, TileType } from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";
import { BUILD_STATE } from "../../engine/build/state";
import { assert } from "../../utils/validate";

// These are the _incremental_ costs of doing another build
const BASE_UNION_FEES: number[] = [1, 2, 3, 4, 5];
const ENGINEER_UNION_FEES: number[] = [0, 1, 1, 2, 4];

export class LondonCostCalculator extends BuildCostCalculator {
  protected readonly currentPlayer = injectCurrentPlayer();
  protected readonly buildState = injectState(BUILD_STATE);

  costOf(
    coordinates: Coordinates,
    newTileType: TileType,
    orientation: Direction,
  ): number {
    const buildCount = this.buildCount();
    assert(buildCount < 5);

    let unionFees: number;
    if (this.currentPlayer().selectedAction === Action.ENGINEER) {
      unionFees = ENGINEER_UNION_FEES[buildCount];
    } else {
      unionFees = BASE_UNION_FEES[buildCount];
    }

    const baseCost = super.costOf(coordinates, newTileType, orientation);
    return baseCost + unionFees;
  }

  private buildCount(): number {
    return (
      this.buildState().buildCount ?? this.buildState().previousBuilds.length
    );
  }
}
