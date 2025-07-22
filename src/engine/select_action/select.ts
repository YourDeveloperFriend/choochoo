import { z } from "zod";
import { assert } from "../../utils/validate";
import { inject } from "../framework/execution_context";
import { ActionProcessor } from "../game/action";
import { Log } from "../game/log";
import { PlayerHelper } from "../game/player";
import { injectCurrentPlayer } from "../game/state";
import { Action, ActionNamingProvider } from "../state/action";
import { AllowedActions } from "./allowed_actions";

export const SelectData = z.object({
  action: z.nativeEnum(Action),
  forced: z.boolean().optional(),
});

export type SelectData = z.infer<typeof SelectData>;

export class SelectAction implements ActionProcessor<SelectData> {
  static readonly action = "select";
  protected readonly currentPlayer = injectCurrentPlayer();
  protected readonly helper = inject(PlayerHelper);
  protected readonly log = inject(Log);
  private readonly actions = inject(AllowedActions);
  private readonly actionNamingProvider = inject(ActionNamingProvider);

  readonly assertInput = SelectData.parse;

  validate({ action }: SelectData): void {
    assert(this.actions.getAvailableActions().has(action), {
      invalidInput: "action not available",
    });
  }

  protected applyLocomotive(): void {
    if (this.currentPlayer().locomotive >= 6) return;

    this.helper.updateCurrentPlayer((player) => {
      player.locomotive++;
    });
  }

  process({ action, forced }: SelectData): boolean {
    this.helper.updateCurrentPlayer((player) => {
      player.selectedAction = action;
    });
    if (action === Action.LOCOMOTIVE) {
      this.applyLocomotive();
    }
    if (forced) {
      this.log.currentPlayer(
        `takes the remaining action (${this.actionNamingProvider.getActionString(action)})`,
      );
    } else {
      this.log.currentPlayer(
        `selected ${this.actionNamingProvider.getActionString(action)}`,
      );
    }
    return true;
  }
}
