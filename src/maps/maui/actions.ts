import { Action, ActionNamingProvider } from "../../engine/state/action";

/** National Parkway Engineer always allows four builds, like the base Engineer action it aliases. */
export const NATIONAL_PARKWAY_ENGINEER = Action.ENGINEER;

/** Coastal Engineer's conditional extra build is custom, so it aliases a custom action slot. */
export const COASTAL_ENGINEER = Action.MAP_CUSTOM_ACTION_1;

export class MauiActionNamingProvider extends ActionNamingProvider {
  getActionString(action?: Action): string {
    if (action === COASTAL_ENGINEER) {
      return "Coastal Engineer";
    }
    if (action === NATIONAL_PARKWAY_ENGINEER) {
      return "National Parkway Engineer";
    }
    return super.getActionString(action);
  }

  getActionDescription(action: Action): string {
    if (action === COASTAL_ENGINEER) {
      return "Build up to four track, or build up to three track and beaches only cost $3.";
    }
    if (action === NATIONAL_PARKWAY_ENGINEER) {
      return "Build up to four track. Mountains only cost $4.";
    }
    return super.getActionDescription(action);
  }
}
