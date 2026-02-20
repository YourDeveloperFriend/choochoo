import { assert } from "../../utils/validate";
import { LocoAction } from "../../engine/move/loco";
import {
  injectCurrentPlayer,
  injectInGamePlayers,
} from "../../engine/game/state";
import { inject, injectState } from "../../engine/framework/execution_context";
import { MOVE_STATE } from "../../engine/move/state";
import { EmptyActionProcessor } from "../../engine/game/action";
import { PlayerHelper } from "../../engine/game/player";
import { Log } from "../../engine/game/log";
import { DoubleBaseUsaPlayerData } from "./starter";

export class DoubleBaseUsaLocoAction extends LocoAction {
  protected readonly players = injectInGamePlayers();

  validate(): void {
    assert(!this.hasReachedLocoLimit(), {
      invalidInput: "can only loco once per round",
    });
    const currentLoco = this.currentPlayer().locomotive;
    const nextLoco = getNextAvailableLocoValue(currentLoco);
    assert(nextLoco !== undefined, {
      invalidInput: `cannot loco more than ${currentLoco}`,
    });
    assert(this.state().moveRound !== 2, {
      invalidInput: "cannot loco on the third move round",
    });
  }

  process(): boolean {
    const currentLoco = this.currentPlayer().locomotive;
    const nextLoco = getNextAvailableLocoValue(currentLoco);
    assert(nextLoco !== undefined);

    this.state.update((s) => s.locomotive.push(this.currentPlayer().color));
    this.playerHelper.updateCurrentPlayer((player) => {
      player.locomotive = nextLoco;
    });
    this.log.currentPlayer(`locos to a new link value of ${nextLoco}`);
    return true;
  }
}

export class DoubleBaseUsaDoubleLocoAction extends EmptyActionProcessor {
  static readonly action = "double-locomotive";
  protected readonly players = injectInGamePlayers();
  protected readonly state = injectState(MOVE_STATE);
  private readonly playerData = injectState(DoubleBaseUsaPlayerData);
  protected readonly currentPlayer = injectCurrentPlayer();
  protected readonly playerHelper = inject(PlayerHelper);
  protected readonly log = inject(Log);

  protected hasReachedLocoLimit(): boolean {
    const player = this.currentPlayer();
    return this.state().locomotive.includes(player.color);
  }

  canEmit(): boolean {
    const currentPlayer = this.currentPlayer();
    if (currentPlayer.money < 10) {
      return false;
    }
    if (this.playerData().get(currentPlayer.color)!.locoDiscs < 1) {
      return false;
    }
    return true;
  }

  validate(): void {
    assert(!this.hasReachedLocoLimit(), {
      invalidInput: "can only loco once per round",
    });
    const currentPlayer = this.currentPlayer();
    const currentLoco = currentPlayer.locomotive;
    const nextLoco = getNextAvailableLocoValue(
      getNextAvailableLocoValue(currentLoco),
    );
    assert(nextLoco !== undefined, {
      invalidInput: `cannot double-loco from ${currentLoco}`,
    });
    assert(this.state().moveRound !== 2, {
      invalidInput: "cannot loco on the third move round",
    });
    assert(
      this.playerData().get(currentPlayer.color)!.locoDiscs >= 1 &&
        currentPlayer.money >= 10,
      {
        invalidInput: "must have $10 and a bonus loco disc to double-loco",
      },
    );
  }

  process(): boolean {
    const currentPlayer = this.currentPlayer();
    const currentLoco = currentPlayer.locomotive;
    const nextLoco = getNextAvailableLocoValue(
      getNextAvailableLocoValue(currentLoco),
    );
    assert(nextLoco !== undefined);

    this.state.update((s) => s.locomotive.push(this.currentPlayer().color));
    this.playerHelper.updateCurrentPlayer((player) => {
      player.locomotive = nextLoco;
      player.money -= 10;
    });
    this.playerData.update((playerData) => {
      playerData.get(currentPlayer.color)!.locoDiscs -= 1;
    });
    this.log.currentPlayer(`double locos to a new link value of ${nextLoco}`);
    return true;
  }
}

function getNextAvailableLocoValue(
  current: number | undefined,
): number | undefined {
  if (current === undefined) {
    return undefined;
  }
  if (current <= 3) {
    return current + 1;
  }
  if (current <= 10) {
    return current + 2;
  }
  return undefined;
}
