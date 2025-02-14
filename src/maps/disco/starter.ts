import { GameStarter } from "../../engine/game/starter";
import { PlayerColor, PlayerData } from "../../engine/state/player";

export class DiscoStarter extends GameStarter {
  protected isProductionEnabled(): boolean {
    return false;
  }

  initializeAvailableCities(): void {
    super.initializeAvailableCities();

    const bag = [...this.bag()];
    this.availableCities.update((cities) => {
      for (const city of cities) {
        city.goods = bag.splice(-3, 3);
      }
    });
    this.bag.set(bag);
  }

  protected buildPlayer(playerId: number, color: PlayerColor): PlayerData {
    return {
      ...super.buildPlayer(playerId, color),
      money: 15,
    };
  }
}
