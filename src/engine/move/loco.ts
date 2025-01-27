import { assert } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { EmptyActionProcessor } from "../game/action";
import { Log } from "../game/log";
import { PlayerHelper } from "../game/player";
import { injectCurrentPlayer } from "../game/state";
import { MOVE_STATE } from "./state";

export class LocoAction extends EmptyActionProcessor {
  static readonly action = "locomotive";
  protected readonly currentPlayer = injectCurrentPlayer();
  protected readonly state = injectState(MOVE_STATE);
  protected readonly playerHelper = inject(PlayerHelper);
  protected readonly log = inject(Log);

  protected hasReachedLocoLimit(): boolean {
    const player = this.currentPlayer();
    return this.state().locomotive.includes(player.color);
  }

  validate(): void {
    const player = this.currentPlayer();
    assert(!this.hasReachedLocoLimit(), "can only loco once per round");
    assert(player.locomotive < 6, "cannot loco more than 6");
  }

  process(): boolean {
    this.state.update((s) => s.locomotive.push(this.currentPlayer().color));
    this.playerHelper.updateCurrentPlayer((player) => player.locomotive++);
    this.log.currentPlayer("locos");
    return true;
  }
}
