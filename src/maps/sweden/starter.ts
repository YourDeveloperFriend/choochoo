import { inject } from "../../engine/framework/execution_context";
import { GameStarter } from "../../engine/game/starter";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { OnRoll } from "../../engine/state/roll";
import { duplicate } from "../../utils/functions";
import { Incinerator } from "./incinerator";

export class SwedenStarter extends GameStarter {
  private readonly incinerator = inject(Incinerator);

  protected onStartGame(): void {
    this.incinerator.initialize();
  }

  initializeStartingCubes(): void {
    this.bag.initState(
      this.random.shuffle([
        ...duplicate(12, Good.YELLOW),
        ...duplicate(8, Good.RED),
        ...duplicate(4, Good.BLUE),
      ]),
    );
  }

  getAvailableCities(): Array<[Good | Good[], CityGroup, OnRoll]> {
    return super.getAvailableCities().filter(([good]) => good === Good.BLACK);
  }

  isProductionEnabled(): boolean {
    return false;
  }
}
