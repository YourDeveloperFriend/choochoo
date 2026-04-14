import { injectState } from "../../engine/framework/execution_context";
import { draw, GameStarter } from "../../engine/game/starter";
import { Action } from "../../engine/state/action";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { OnRoll } from "../../engine/state/roll";
import { duplicate } from "../../utils/functions";
import { ACTIONS_REMAINING } from "./actions";

export class TrislandStarter extends GameStarter {
  private readonly actionsRemaining = injectState(ACTIONS_REMAINING);

  protected onStartGame(): void {
    super.onStartGame();
    this.actionsRemaining.initState(
      this.players().map((player) => ({
        player: player.color,
        actions: [
          [Action.ENGINEER, 2],
          [Action.LOCOMOTIVE, 2],
          [Action.FIRST_BUILD, 2],
          [Action.PRODUCTION, 1],
          [Action.URBANIZATION, 1],
        ].map(([action, remaining]) => ({ action, remaining })),
      })),
    );
  }

  protected startingBag(): Good[] {
    return [
      ...duplicate(16, Good.RED),
      ...duplicate(16, Good.YELLOW),
      ...duplicate(16, Good.BLUE),
      ...duplicate(16, Good.BLACK),
    ];
  }

  getAvailableCities(): Array<[Good | Good[], CityGroup, OnRoll]> {
    return [
      [Good.RED, CityGroup.WHITE, 3],
      [Good.BLUE, CityGroup.WHITE, 4],
      [Good.BLACK, CityGroup.WHITE, 5],
    ];
  }
}
