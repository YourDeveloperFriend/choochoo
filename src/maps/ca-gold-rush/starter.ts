import { GameStarter } from "../../engine/game/starter";
import { Good } from "../../engine/state/good";
import { CaliforniaGoldRushMapData } from "./grid";
import { injectState } from "../../engine/framework/execution_context";
import { OwnedGold } from "./score";
import { CityGroup } from "../../engine/state/city_group";
import { OnRoll } from "../../engine/state/roll";

export class CaliforniaGoldRushStarter extends GameStarter {
  private readonly ownedGold = injectState(OwnedGold);

  // Remove all yellow cubes from the starting bag
  protected startingBag(): Good[] {
    return super.startingBag().filter<Good>((g) => g !== Good.YELLOW);
  }

  getAvailableCities(): Array<[Good | Good[], CityGroup, OnRoll]> {
    return super
      .getAvailableCities()
      .filter(([cityColor, _]) => cityColor !== Good.YELLOW);
  }

  // Add yellow cubes to expected locations
  protected onStartGame(): void {
    super.onStartGame();

    this.ownedGold.initState(
      new Map(this.turnOrder().map((color) => [color, 0])),
    );

    const bag = [...this.bag()];
    for (const space of this.gridHelper.all()) {
      const mapData = space.getMapSpecific(CaliforniaGoldRushMapData.parse);
      if (mapData && mapData.goldLocation) {
        this.gridHelper.update(space.coordinates, (loc) => {
          loc.goods = [Good.YELLOW];
        });
      }
    }
    this.bag.set(bag);
  }
}
