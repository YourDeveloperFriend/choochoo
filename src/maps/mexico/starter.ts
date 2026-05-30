import { GameStarter } from "../../engine/game/starter";
import { Good } from "../../engine/state/good";
import { CityData } from "../../engine/state/space";
import { duplicate } from "../../utils/functions";
import { MexicoRoleHelper } from "./roles";
import { inject } from "../../engine/framework/execution_context";

function drawYBP(count: number, bag: Good[]): Good[] {
  const result: Good[] = [];
  for (let i = 0; i < count; i++) {
    const idx = bag.findIndex(
      (g) => g === Good.YELLOW || g === Good.BLUE || g === Good.PURPLE,
    );
    if (idx === -1) break;
    result.push(...bag.splice(idx, 1));
  }
  return result;
}

export class MexicoStarter extends GameStarter {
  private readonly roleHelper = inject(MexicoRoleHelper);

  protected startingBag(): Good[] {
    return [
      ...duplicate(20, Good.PURPLE),
      ...duplicate(20, Good.YELLOW),
      ...duplicate(20, Good.BLUE),
    ];
  }

  protected getPlacedGoodsFor(
    bag: Good[],
    _playerCount: number,
    location: CityData,
  ): Good[] {
    const colors = Array.isArray(location.color)
      ? location.color
      : [location.color];
    switch (colors[0]) {
      case Good.BLUE:
        return [Good.BLACK, ...drawYBP(1, bag)];
      case Good.YELLOW:
        return [Good.RED, ...drawYBP(1, bag)];
      default:
        return drawYBP(2, bag);
    }
  }

  protected getGoodsGrowthGoodsFor(
    bag: Good[],
    cityColor: Good | Good[],
    urbanized: boolean,
  ): Array<undefined | Good> {
    return drawYBP(urbanized ? 1 : 3, bag);
  }

  protected onStartGame(): void {
    this.roleHelper.initRoles(-1);

    this.bag.update((bag) => {
      bag.push(...duplicate(11, Good.BLACK));
      bag.push(...duplicate(11, Good.RED));
    });
  }
}
