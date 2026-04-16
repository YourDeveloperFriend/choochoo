import { GameStarter } from "../../engine/game/starter";
import { PlayerColor, PlayerData } from "../../engine/state/player";

export class FourLocoStarter extends GameStarter {
  protected buildPlayer(playerId: number, color: PlayerColor): PlayerData {
    return {
      ...super.buildPlayer(playerId, color),
      // All players start at engine level 4
      locomotive: 4,
    };
  }
}
