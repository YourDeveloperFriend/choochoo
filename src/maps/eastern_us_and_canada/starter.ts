import { GameStarter } from "../../engine/game/starter";
import { PlayerColor, PlayerData } from "../../engine/state/player";

export class EasternUsAndCanadaStarter extends GameStarter {
  protected buildPlayer(playerId: number, color: PlayerColor): PlayerData {
    return {
      ...super.buildPlayer(playerId, color),
      money: 5,
      shares: 1,
    };
  }

  isGoodsGrowthEnabled(): boolean {
    return false;
  }
}
