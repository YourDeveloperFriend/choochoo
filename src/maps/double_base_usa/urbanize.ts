import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { injectState } from "../../engine/framework/execution_context";
import { URBANIZE_COUNT } from "./build";

export class DoubleBaseUsaUrbanizeAction extends UrbanizeAction {
  private readonly urbanizeCount = injectState(URBANIZE_COUNT);

  canEmit(): boolean {
    return this.helper.canUrbanize();
  }

  process(data: UrbanizeData): boolean {
    this.urbanizeCount.set(this.urbanizeCount() + 1);
    return super.process(data);
  }
}
