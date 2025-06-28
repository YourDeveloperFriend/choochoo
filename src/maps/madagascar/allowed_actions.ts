import { inject, injectState } from "../../engine/framework/execution_context";
import { SetKey } from "../../engine/framework/key";
import { Ender } from "../../engine/game/ender";
import { Random } from "../../engine/game/random";
import { RoundEngine } from "../../engine/game/round";
import { GameStarter } from "../../engine/game/starter";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import {
  Action,
  ActionNamingProvider,
  ActionZod,
} from "../../engine/state/action";
import { iterate, peek } from "../../utils/functions";
import { ImmutableSet } from "../../utils/immutable";

const DISABLED_ACTIONS = new SetKey("disabledActions", {
  parse: ActionZod.parse,
});

export class MadagascarAllowedActions extends AllowedActions {
  private readonly disabledActions = injectState(DISABLED_ACTIONS);

  getDisabledActionReason(action: Action): string | undefined {
    return this.disabledActions().has(action)
      ? "This action is disabled this round"
      : undefined;
  }

  getLastDisabledAction(): Action {
    return peek([...this.disabledActions()]);
  }

  getActions(): ImmutableSet<Action> {
    return ImmutableSet([
      Action.LAST_BUILD,
      Action.LAST_MOVE,
      Action.LOCOMOTIVE,
      Action.URBANIZATION,
      Action.SLOW_ENGINEER,
      Action.LAST_PLAYER,
      Action.HIGH_COSTS,
      Action.ONE_MOVE,
    ]);
  }
}

export class MadagascarStarter extends GameStarter {
  private readonly disabledActions = injectState(DISABLED_ACTIONS);

  protected onBeginStartGame(): void {
    super.onBeginStartGame();
    this.disabledActions.initState(new Set());
  }
}

export class MadagascarRoundEngine extends RoundEngine {
  private readonly disabledActions = injectState(DISABLED_ACTIONS);
  private readonly random = inject(Random);
  private readonly allowedActions = inject(AllowedActions);
  private readonly actionNamingProvider = inject(ActionNamingProvider);

  start(round: number) {
    super.start(round);
    const allActions = [...this.allowedActions.getActions()];
    let nextActionIndex =
      round !== 1
        ? allActions.indexOf(
            (
              this.allowedActions as MadagascarAllowedActions
            ).getLastDisabledAction(),
          )
        : -1;
    const newActions: Action[] = [];
    iterate(7 - this.playerCount(), () => {
      const dieRoll = this.random.rollDie();
      for (let i = dieRoll; i > 0; ) {
        nextActionIndex++;
        nextActionIndex = nextActionIndex % allActions.length;
        if (!newActions.includes(allActions[nextActionIndex])) {
          i--;
        }
      }
      newActions.push(allActions[nextActionIndex]);
    });
    this.log.log(
      "Disabling actions " +
        newActions.map(this.actionNamingProvider.getActionString).join(", "),
    );
    this.disabledActions.set(new Set(newActions));
  }
}

export class MadagascarGameEnder extends Ender {
  private readonly disabledActions = injectState(DISABLED_ACTIONS);

  onEndGame(): void {
    super.onEndGame();
    this.disabledActions.set(new Set());
  }
}
