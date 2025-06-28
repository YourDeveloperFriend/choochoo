import { Action, ActionNamingProvider } from "../../engine/state/action";

export class GermanyActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.ENGINEER) {
      return "Build one tile (the most expensive one) at half price (rounded down).";
    }
    return super.getActionDescription(action);
  }
}
