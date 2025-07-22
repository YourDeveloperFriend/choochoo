import { EmptyActionProcessor } from "../game/action";

/** Skips the select action step. Not available in the base game, but some games allow this. */
export class SkipAction extends EmptyActionProcessor {
  static action = "skip-select";

  validate() {}

  process(): boolean {
    return true;
  }
}
