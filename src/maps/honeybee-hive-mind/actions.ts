import { Action, ActionNamingProvider } from "../../engine/state/action";

export const WAGGLE_DANCE = Action.MAP_CUSTOM_ACTION_1;
export const DOMINANT_WORKER_BEE = Action.MAP_CUSTOM_ACTION_2;

export class HoneybeeActionNamingProvider extends ActionNamingProvider {
  getActionString(action?: Action): string {
    if (action === WAGGLE_DANCE) {
      return "Waggle Dance";
    }
    if (action === DOMINANT_WORKER_BEE) {
      return "Dominant Worker Bee";
    }
    return super.getActionString(action);
  }
  getActionDescription(action: Action): string {
    if (action === WAGGLE_DANCE) {
      return "Before deliveries, relocate up to three bee swarms to different Cities.";
    }
    if (action === DOMINANT_WORKER_BEE) {
      return "Ignore bee swarm fees on both deliveries this turn.";
    }
    return super.getActionDescription(action);
  }
}
