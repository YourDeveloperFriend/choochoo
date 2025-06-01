import {AllowedActions} from "../../engine/select_action/allowed_actions";
import {Action,} from "../../engine/state/action";
import {ImmutableSet} from "../../utils/immutable";

export class LondonAllowedActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    let actions = [
      Action.FIRST_BUILD,
      Action.FIRST_MOVE,
      Action.ENGINEER];
    if (this.players().length >= 4) {
      actions.push(Action.LOCOMOTIVE);
    }
    actions = actions.concat([
      Action.URBANIZATION,
      Action.TURN_ORDER_PASS
    ]);
    return ImmutableSet(actions);
  }
}
