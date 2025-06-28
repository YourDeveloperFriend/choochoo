import { Action, ActionNamingProvider } from "../../engine/state/action";

// The factory action replaces production on this map
export const FACTORY_ACTION = Action.PRODUCTION;

export class ChesapeakeAndOhioActionNamingProvider extends ActionNamingProvider {
  getActionString(action?: Action): string {
    if (action === FACTORY_ACTION) {
      return "Factory";
    }
    return super.getActionString(action);
  }

  getActionDescription(action: Action): string {
    if (action === FACTORY_ACTION) {
      return "You may build track as normal and still build a factory.";
    }
    return super.getActionDescription(action);
  }
}
