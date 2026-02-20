import { useInjectedState } from "../../client/utils/injection_context";
import { Action } from "../../engine/state/action";
import { playerColorToString } from "../../engine/state/player";
import { MapViewSettings } from "../view_settings";
import { ACTIONS_REMAINING } from "./actions";
import { TrislandRules } from "./rules";
import { TrislandMapSettings } from "./settings";
import { TrislandRivers } from "./rivers";

export class TrislandViewSettings
  extends TrislandMapSettings
  implements MapViewSettings
{
  getMapRules = TrislandRules;
  getTexturesLayer = TrislandRivers;

  getActionCaption(action: Action): string[] | string | undefined {
    const actionsRemaining = useInjectedState(ACTIONS_REMAINING);
    return actionsRemaining
      .map((remaining) => [
        remaining.player,
        remaining.actions.find((a) => a.action === action)!.remaining,
      ])
      .map(
        ([player, remaining]) => `${playerColorToString(player)} x${remaining}`,
      );
  }
}
