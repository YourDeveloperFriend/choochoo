import { injectState } from "../../engine/framework/execution_context";
import { GameStarter } from "../../engine/game/starter";
import { Action } from "../../engine/state/action";
import { WYOMING_INITIAL_DISABLED_ACTION } from "./allowed_actions";

export class WyomingStarter extends GameStarter {
  private readonly initialDisabledAction = injectState(
    WYOMING_INITIAL_DISABLED_ACTION,
  );

  protected onBeginStartGame(): void {
    super.onBeginStartGame();
    this.initialDisabledAction.initState(
      this.random.shuffle([Action.URBANIZATION, Action.ENGINEER])[0],
    );
  }
}
