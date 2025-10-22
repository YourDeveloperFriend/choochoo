import { Action, ActionNamingProvider } from "../../engine/state/action";

export class RustBeltExpressActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.FIRST_MOVE) {
      return (
        super.getActionDescription(action) +
        " Additionally, when performing deliveries you may pass through a single matching city for $2."
      );
    }
    return super.getActionDescription(action);
  }
}
