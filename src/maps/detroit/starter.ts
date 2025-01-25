import { injectState } from "../../engine/framework/execution_context";
import { draw, GameStarter } from "../../engine/game/starter";
import { Action } from "../../engine/state/action";
import { Good } from "../../engine/state/good";
import { PlayerColor, PlayerData } from "../../engine/state/player";
import { SOLO_ACTION_COUNT } from "./actions";
import { OUT_OF_GAME_ROUND } from "./end_game";

export class DetroitStarter extends GameStarter {
  private readonly rounds = injectState(OUT_OF_GAME_ROUND);
  private readonly soloActionCount = injectState(SOLO_ACTION_COUNT);

  protected onStartGame(): void {
    this.rounds.initState(new Map());
    if (this.players().length === 1) {
      this.soloActionCount.initState(
        new Map([
          [Action.ENGINEER, 3],
          [Action.LOCOMOTIVE, 3],
          [Action.URBANIZATION, 3],
        ]),
      );
    }
  }

  protected buildPlayer(playerId: number, color: PlayerColor): PlayerData {
    return {
      ...super.buildPlayer(playerId, color),
      money: 0,
      shares: 5,
    };
  }

  protected getDrawnCubesFor(bag: Good[], _: boolean): Good[] {
    return draw(1, bag);
  }
}
