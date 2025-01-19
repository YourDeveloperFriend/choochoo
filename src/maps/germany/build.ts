import {BuilderHelper} from "../../engine/build/helper";
import {Key} from "../../engine/framework/key";
import z from "zod";
import {BuildPhase} from "../../engine/build/phase";
import {inject, injectState} from "../../engine/framework/execution_context";
import {BuildAction, BuildData} from "../../engine/build/build";
import {GermanyCostCalculator} from "./cost";
import {assert} from "../../utils/validate";

export class GermanyBuilderHelper extends BuilderHelper {
  getMaxBuilds(): number {
    return 3;
  }
}

// This keeps track of the raw cost (that is, the cost before accounting for the Engineer discount) to build track for
// each of the tile lays thus far this build phase. This gets used to calculate the effective cost since the most
// expensive build, and thus which tile gets discounted, can change over the course of the phase.
export const RAW_BUILD_COSTS = new Key('RAW_BUILD_COSTS', { parse: z.array(z.number()).parse })

export class GermanyBuildAction extends BuildAction {
  private readonly rawBuildCosts = injectState(RAW_BUILD_COSTS);
  private readonly germanyCostCalculator = inject(GermanyCostCalculator);

  process(data: BuildData): boolean {
    const cost = this.germanyCostCalculator.rawCostOf(data.coordinates, data.tileType);

    let result = super.process(data);

    let newRawBuildCosts = this.rawBuildCosts().slice();
    newRawBuildCosts.push(cost);
    this.rawBuildCosts.set(newRawBuildCosts);

    return result;
  }
}

export class GermanyBuildPhase extends BuildPhase {
  private readonly rawBuildCosts = injectState(RAW_BUILD_COSTS);

  onStartTurn(): void {
    this.rawBuildCosts.initState([]);
    return super.onStartTurn();
  }

  onEndTurn(): void {
    const newDanglers = this.getDanglersAsInfo(this.currentPlayer().color);
    assert(newDanglers.length === 0, { invalidInput: 'You cannot have any dangling track at the end of your build on the Germany map.' });

    this.rawBuildCosts.delete();
    return super.onEndTurn();
  }
}
