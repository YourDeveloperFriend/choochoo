import { injectState } from "../../engine/framework/execution_context";
import { GameStarter } from "../../engine/game/starter";
import { allGoods } from "../../engine/state/good";
import { DELIVERY_SPACES, MANIFEST, NEW_CITY_SUPPLY } from "./state";

export class Fac51GameStarter extends GameStarter {
  private readonly manifest = injectState(MANIFEST);
  private readonly newCitySupply = injectState(NEW_CITY_SUPPLY);

  isGoodsGrowthEnabled(): boolean {
    return false;
  }

  initializeAvailableCities(): void {
    // Show one choice while retaining the base game's eight-tile supply.
    this.newCitySupply.initState(super.getAvailableCities().length);
    this.availableCities.initState([{ color: [], goods: [], onRoll: [] }]);
  }

  protected onStartGame(): void {
    const colors = [...allGoods];
    const markers = this.random.shuffle([
      ...colors,
      colors[this.random.random(colors.length)],
    ]);
    for (const [index, coordinates] of DELIVERY_SPACES.entries()) {
      this.gridHelper.update(coordinates, (space) => {
        space.goods = [markers[index]];
      });
    }
    this.manifest.initState(
      new Map(this.players().map((player) => [player.color, 0])),
    );
  }
}
