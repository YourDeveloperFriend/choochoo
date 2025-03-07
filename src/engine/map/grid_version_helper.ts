import { injectState } from "../framework/execution_context";
import { GRID_VERSION } from "../game/state";

export class GridVersionHelper {
  private readonly gridVersion = injectState(GRID_VERSION);

  getGridVersion(): number {
    return this.gridVersion.isInitialized() ? this.gridVersion() : 1;
  }

  updateGridVersion(): void {
    if (this.gridVersion.isInitialized()) {
      this.gridVersion.set(this.gridVersion() + 1);
    } else {
      this.gridVersion.initState(2);
    }
  }
}
