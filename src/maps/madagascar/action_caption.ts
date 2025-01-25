import { useInjected } from "../../client/utils/injection_context";
import { Action } from "../../engine/state/action";
import { MadagascarAllowedActions } from "./allowed_actions";

export function getActionCaption(action: Action): string | undefined {
  const allowed = useInjected(MadagascarAllowedActions);
  if (allowed.getLastDisabledAction() === action) {
    return "Stack";
  }
}
