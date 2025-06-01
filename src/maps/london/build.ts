import { BuilderHelper } from "../../engine/build/helper";

export class LondonBuilderHelper extends BuilderHelper {
  getMaxBuilds(): number {
    return 5;
  }
}
