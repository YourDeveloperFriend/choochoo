import { BuildCostCalculator } from "../../engine/build/cost";
import { inject, injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import { Coordinates } from "../../utils/coordinates";
import { Direction, TileType } from "../../engine/state/tile";
import { BuildAction, BuildData } from "../../engine/build/build";
import { MoveValidator, RouteInfo } from "../../engine/move/validator";
import { assert } from "../../utils/validate";
import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { Grid } from "../../engine/map/grid";
import { City } from "../../engine/map/city";

export class CentralNewEnglandBuildCostCalculator extends BuildCostCalculator {
  private readonly currentRound = injectState(ROUND);

  costOf(
    coordinates: Coordinates,
    newTileType: TileType,
    orientation: Direction,
  ): number {
    const baseCost = super.costOf(coordinates, newTileType, orientation);
    if (this.currentRound() % 2 === 1) {
      return baseCost + 1;
    }
    return baseCost;
  }
}

export class CentralNewEnglandBuildAction extends BuildAction {
  private readonly moveValidator = inject(MoveValidator);

  process(data: BuildData): boolean {
    const result = super.process(data);

    // Validate that this build has not resulted in any duplicate routes between two locations
    assert(!anyDuplicateRouteExists(this.grid(), this.moveValidator), {
      invalidInput:
        "A player cannot have multiple direct routes between two locations",
    });

    return result;
  }
}

export class CentralNewEnglandUrbanizeAction extends UrbanizeAction {
  private readonly moveValidator = inject(MoveValidator);

  process(data: UrbanizeData): boolean {
    const result = super.process(data);

    // Validate that this build has not resulted in any duplicate routes between two locations
    assert(!anyDuplicateRouteExists(this.grid(), this.moveValidator), {
      invalidInput:
        "A player cannot have multiple direct routes between two locations",
    });

    return result;
  }
}

function anyDuplicateRouteExists(
  grid: Grid,
  moveValidator: MoveValidator,
): boolean {
  for (const space of grid.values()) {
    if (space instanceof City || space.hasTown()) {
      const routes = moveValidator.findRoutesFromLocation(space.coordinates);
      if (hasDuplicateRoute(routes)) {
        return true;
      }
    }
  }
  return false;
}

function hasDuplicateRoute(routes: RouteInfo[]): boolean {
  for (let i = 0; i < routes.length; i++) {
    const a = routes[i];
    for (let j = i + 1; j < routes.length; j++) {
      const b = routes[j];
      if (a.destination.equals(b.destination)) {
        return true;
      }
    }
  }
  return false;
}
