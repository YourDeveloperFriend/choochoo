import { MoveHelper } from "../../engine/move/helper";
import { City } from "../../engine/map/city";
import { Good } from "../../engine/state/good";
import { MoveAction, MoveData } from "../../engine/move/move";
import { assert } from "../../utils/validate";
import { PlayerColor } from "../../engine/state/player";
import { inject } from "../../engine/framework/execution_context";
import { PlayerHelper } from "../../engine/game/player";

export class ChicagoSpeakEasyMoveHelper extends MoveHelper {
  canDeliverTo(city: City, good: Good): boolean {
    if (city.getGoods().indexOf(Good.BLACK) !== -1) {
      return false;
    }
    return super.canDeliverTo(city, good);
  }

  canMoveThrough(city: City, good: Good): boolean {
    if (city.accepts(Good.BLACK)) {
      return false;
    }
    return !city.accepts(good);
  }
}

export class ChicagoSpeakEasyMoveAction extends MoveAction {
  private readonly playerHelper = inject(PlayerHelper);

  validate(action: MoveData): void {
    super.validate(action);

    const player = this.currentPlayer();
    assert(player.money >= this.getBribeCost(action), {
      invalidInput: "Player doesn't have enough money for bribes!",
    });
  }

  process(action: MoveData): boolean {
    const result = super.process(action);
    const bribeCost = this.getBribeCost(action);
    if (bribeCost !== 0) {
      this.playerHelper.update(
        this.currentPlayer().color,
        (player) => (player.money -= this.getBribeCost(action)),
      );
      this.log.currentPlayer("pays $" + bribeCost + " in bribes.");
    }
    return result;
  }

  calculateIncome(action: MoveData): Map<PlayerColor | undefined, number> {
    const income = super.calculateIncome(action);
    if (action.good === Good.BLACK) {
      const currentPlayer = this.currentPlayer();
      const playerIncome = income.get(currentPlayer.color);
      if (playerIncome !== undefined && playerIncome > 0) {
        income.set(currentPlayer.color, playerIncome - 1);
      }
    }
    return income;
  }

  private getBribeCost(action: MoveData): number {
    if (action.good === Good.BLACK) {
      return 0;
    }
    const grid = this.grid();
    let cost = 0;
    const startingCity = grid.get(action.startingCity);
    if (startingCity) {
      cost += startingCity.getGoods().filter((g) => g === Good.BLACK).length;
    }
    for (let i = 0; i < action.path.length - 1; i++) {
      const city = grid.get(action.path[i].endingStop);
      if (city) {
        cost += city.getGoods().filter((g) => g === Good.BLACK).length;
      }
    }
    return cost;
  }
}
