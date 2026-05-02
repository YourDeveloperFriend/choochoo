import { draw, GameStarter } from "../../engine/game/starter";
import { Good } from "../../engine/state/good";
import { injectState } from "../../engine/framework/execution_context";
import { MiningExpertise } from "./mining";
import { CityData } from "../../engine/state/space";
import { MapKey } from "../../engine/framework/key";
import z from "zod";
import { Action, ActionZod } from "../../engine/state/action";
import { GoldsmithVariant } from "./action_selection";

export const ActionMoney = new MapKey(
  "ActionMoney",
  ActionZod.parse,
  z.number().parse,
);

export class MinasGeraesStarter extends GameStarter {
  private readonly miningExpertise = injectState(MiningExpertise);
  private readonly actionMoney = injectState(ActionMoney);
  private readonly goldsmithVariant = injectState(GoldsmithVariant);

  protected onStartGame(): void {
    super.onStartGame();

    this.miningExpertise.initState(
      new Map(this.turnOrder().map((color) => [color, 2])),
    );
    this.actionMoney.initState(
      new Map([
        [Action.LOCOMOTIVE, 1],
        [Action.URBANIZATION, 1],
        [Action.GOLDSMITH, 1],
      ]),
    );
    this.goldsmithVariant.initState(-1);
  }

  protected getPlacedGoodsFor(
    bag: Good[],
    playerCount: number,
    location: CityData,
  ): Good[] {
    if (location.color === Good.BLACK || (location.color instanceof Array && location.color.indexOf(Good.BLACK) !== -1)) {
      // Draw 2 yellow from the bag
      return drawMatching(bag, 2, (good) => good === Good.YELLOW);
    }
    if (location.mapSpecific?.ouroPretoCubeSource) {
      // Draw of any color for Ouro Preto
      return draw(playerCount, bag);
    }
    if (location.mapSpecific?.ouroPretoCost !== undefined) {
      return [];
    }
    // Otherwise draw non-yellows
    return drawMatching(bag, 2, (good) => good !== Good.YELLOW);
  }

  protected getGoodsGrowthGoodsFor(
    bag: Good[],
    cityColor: Good | Good[],
    urbanized: boolean,
  ): Array<undefined | Good> {
    let drawn: Good[];
    if (cityColor === Good.BLACK || (cityColor instanceof Array && cityColor.indexOf(Good.BLACK) !== -1)) {
      drawn = draw(2, bag);
    } else {
      drawn = drawMatching(bag, 2, (good) => good !== Good.YELLOW);
    }
    if (urbanized) {
      return drawn;
    } else {
      // Put the 2 goods growth cubes at the top of the goods growth chart, not at the bottom
      return [undefined, ...drawn];
    }
  }
}

function drawMatching<T>(
  arr: T[],
  count: number,
  pred: (elem: T) => boolean,
): T[] {
  const drawn: T[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (pred(arr[i])) {
      drawn.push(arr[i]);
      arr.splice(i, 1);
      i -= 1;
      if (drawn.length >= count) {
        break;
      }
    }
  }
  return drawn;
}
