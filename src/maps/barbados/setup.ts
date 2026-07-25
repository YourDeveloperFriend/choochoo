import { injectState } from "../../engine/framework/execution_context";
import { draw, GameStarter } from "../../engine/game/starter";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { OnRoll } from "../../engine/state/roll";
import { duplicate } from "../../utils/functions";
import { SELECTED_ACTIONS } from "./actions";

export class BarbadosStarter extends GameStarter {
  private readonly selectedActions = injectState(SELECTED_ACTIONS);

  protected onBeginStartGame(): void {
    super.onBeginStartGame();
    this.selectedActions.initState(new Set());
  }

  protected startingBag(): Good[] {
    return super.startingBag().filter((g) => g !== Good.PURPLE);
  }

  getAvailableCities(): Array<[Good | Good[], CityGroup, OnRoll]> {
    return super
      .getAvailableCities()
      .filter((availableCity) => availableCity[1] !== CityGroup.BLACK);
  }

  protected getGoodsGrowthGoodsFor(
    bag: Good[],
    cityColor: Good | Good[],
    urbanized: boolean,
  ): Array<undefined | Good> {
    const cityColorNormalized = Array.isArray(cityColor)
      ? cityColor[0]
      : cityColor;
    const cube =
      cityColorNormalized === Good.RED || cityColorNormalized === Good.BLUE
        ? drawIgnoringMatches(bag, cityColorNormalized)
        : draw(1, bag)[0];
    return [...duplicate(urbanized ? 1 : 2, undefined), cube];
  }
}

function drawIgnoringMatches<T>(arr: T[], avoid: T): T {
  let drawn: T | undefined = undefined;
  do {
    if (drawn !== undefined) {
      arr.unshift(drawn);
    }
    drawn = arr.pop()!;
  } while (drawn === avoid);
  return drawn;
}
