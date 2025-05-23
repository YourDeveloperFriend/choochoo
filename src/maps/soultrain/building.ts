import z from "zod";
import { BuildAction, BuildData } from "../../engine/build/build";
import { BuildCostCalculator } from "../../engine/build/cost";
import { BuilderHelper } from "../../engine/build/helper";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Action } from "../../engine/state/action";
import { SpaceType } from "../../engine/state/location_type";
import { LandType } from "../../engine/state/space";
import { Direction, TileType } from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";

const RUNNING_COST = new Key("runningCost", { parse: z.number().parse });

class EngineerManager {
  private readonly runningCost = injectState(RUNNING_COST);

  getRunningCost(): number {
    return this.runningCost.isInitialized() ? this.runningCost() : 0;
  }

  registerBuild(cost: number) {
    const newCost = this.getRunningCost() + cost;
    if (!this.runningCost.isInitialized()) {
      this.runningCost.initState(newCost);
    } else {
      this.runningCost.set(newCost);
    }
  }
}

export class SoulTrainCalculator extends BuildCostCalculator {
  private readonly manager = inject(EngineerManager);
  private readonly currentPlayer = injectCurrentPlayer();

  costOf(
    coordinates: Coordinates,
    newTileType: TileType,
    orientation: Direction,
  ): number {
    const cost = super.costOf(coordinates, newTileType, orientation);
    if (this.currentPlayer().selectedAction !== Action.ENGINEER) {
      return cost;
    }

    const runningCost = this.manager.getRunningCost();
    if (runningCost % 2 === 0) {
      return Math.ceil(cost / 2);
    }
    return Math.floor(cost / 2);
  }
  protected getCostOfLandType(type: LandType): number {
    if (type === SpaceType.HILL) {
      return 4;
    }
    return super.getCostOfLandType(type);
  }
}

export class SoulTrainBuildAction extends BuildAction {
  private readonly manager = inject(EngineerManager);

  process(data: BuildData): boolean {
    const result = super.process(data);
    this.manager.registerBuild(
      this.costCalculator.costOf(
        data.coordinates,
        data.tileType,
        data.orientation,
      ),
    );
    return result;
  }
}

export class SoulTrainBuilderHelper extends BuilderHelper {
  protected minimumBuildCost(): number {
    return 1;
  }

  getMaxBuilds(): number {
    return 6;
  }
}
