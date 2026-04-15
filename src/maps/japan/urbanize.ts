import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { BuilderHelper } from "../../engine/build/helper";

export class JapanBuilderHelper extends BuilderHelper {
  isAtEndOfTurn(): boolean {
    // Urbanization uses a build.
    return this.buildsRemaining() === 0;
  }
}

export class JapanUrbanizeAction extends UrbanizeAction {
  process(data: UrbanizeData): boolean {
    // Urbanizing counts against your builds on this map
    this.buildState.update((state) => {
      state.buildCount!++;
    });

    return super.process(data);
  }
}
