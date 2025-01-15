import { injectState } from "../../engine/framework/execution_context";
import { GameStarter } from "../../engine/game/starter";
import { PlayerColor, PlayerData } from "../../engine/state/player";
import { OUT_OF_GAME_ROUND } from "./end_game";

export class DetroitStarter extends GameStarter {
  private readonly rounds = injectState(OUT_OF_GAME_ROUND);

  protected onStartGame(): void {
    this.rounds.initState(new Map());
  }

  protected buildPlayer(playerId: number, color: PlayerColor): PlayerData {
    return {
      ...super.buildPlayer(playerId, color),
      money: 0,
      shares: 5,
    };
  }
}