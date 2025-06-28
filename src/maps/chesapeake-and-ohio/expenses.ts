import { ProfitHelper } from "../../engine/income_and_expenses/helper";
import { PlayerData } from "../../engine/state/player";
import { injectGrid } from "../../engine/game/state";
import { ChesapeakeAndOhioMapData } from "./build";

export class ChesapeakeAndOhioProfitHelper extends ProfitHelper {
  private readonly grid = injectGrid();

  getExpenses(player: PlayerData): number {
    const basicExpenses = super.getExpenses(player);

    let factoryCount = 0;
    for (const city of this.grid().cities()) {
      const mapData = city.getMapSpecific(ChesapeakeAndOhioMapData.parse);
      if (mapData && mapData.factoryColor === player.color) {
        factoryCount += 1;
      }
    }

    return basicExpenses + factoryCount;
  }
}
