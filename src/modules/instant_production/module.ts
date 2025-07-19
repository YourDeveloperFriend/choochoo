import { Module } from "../../engine/module/module";
import { SimpleConstructor } from "../../engine/framework/dependency_stack";
import { assert } from "../../utils/validate";
import { City } from "../../engine/map/city";
import { MovePhase } from "../../engine/move/phase";
import { inject, injectState } from "../../engine/framework/execution_context";
import {
  applyInstantProduction,
  INSTANT_PRODUCTION_STATE,
  InstantProductionAction,
} from "./instant_production";
import { MoveAction, MoveData } from "../../engine/move/move";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { Good, goodToString } from "../../engine/state/good";
import { Space } from "../../engine/map/grid";

export class InstantProductionModule extends Module {
  installMixins() {
    this.installMixin(MovePhase, movePhaseMixin);
    this.installMixin(MoveAction, moveActionMixin);
  }
}

function movePhaseMixin(
  Ctor: SimpleConstructor<MovePhase>,
): SimpleConstructor<MovePhase> {
  return class extends Ctor {
    private readonly instantProductionState = injectState(
      INSTANT_PRODUCTION_STATE,
    );

    configureActions() {
      super.configureActions();
      this.installAction(InstantProductionAction);
    }

    onStartTurn() {
      const result = super.onStartTurn();
      this.instantProductionState.initState({});
      return result;
    }

    onEndTurn(): void {
      this.instantProductionState.delete();
      return super.onEndTurn();
    }
  };
}

function moveActionMixin(
  Ctor: SimpleConstructor<MoveAction>,
): SimpleConstructor<MoveAction> {
  return class extends Ctor {
    private readonly instantProductionState = injectState(
      INSTANT_PRODUCTION_STATE,
    );
    private readonly goodsHelper = inject(GoodsHelper);

    process(action: MoveData): boolean {
      super.process(action);

      const grid = this.grid();
      const start = grid.get(action.startingCity);
      const end = grid.get(action.path[action.path.length - 1].endingStop);

      const validTargets = [start, end].filter(isInstantProductionTarget);

      // If neither side can instant production, just end the turn; no instant production
      if (validTargets.length === 0) {
        return true;
      }

      // If exactly one side can instant production, just apply it since there is no choice
      if (validTargets.length === 1) {
        applyInstantProduction(
          this.gridHelper,
          this.goodsHelper,
          this.log,
          validTargets[0]!.coordinates,
        );
        return true;
      }

      // Both sides are valid targets, so present the choice on where to apply it
      assert(start instanceof City);
      assert(end instanceof City);
      let drawnCube: Good | undefined;
      if (!hasGoodsGrowthCube(start) && !hasGoodsGrowthCube(end)) {
        drawnCube = this.goodsHelper.drawGood();
        this.log.log(
          `A ${goodToString(drawnCube)} was drawn for instant production.`,
        );
      }

      this.instantProductionState.set({
        startCity: start.coordinates,
        endCity: end.coordinates,
        drawnCube: drawnCube,
      });
      return false;
    }
  };
}

function isInstantProductionTarget(space: Space | undefined): boolean {
  if (space === undefined) {
    return false;
  }
  if (space instanceof City) {
    const onRoll = space.onRoll();
    if (onRoll.length === 0) {
      return false;
    }
    return true;
  }
  return false;
}

function hasGoodsGrowthCube(city: City): boolean {
  const onRolls = city.onRoll();
  for (const onRoll of onRolls) {
    for (const good of onRoll.goods) {
      if (good != null) {
        return true;
      }
    }
  }
  return false;
}
