import {draw, GameStarter} from "../../engine/game/starter";
import {Good} from "../../engine/state/good";
import {injectState} from "../../engine/framework/execution_context";
import {MiningExpertise} from "./mining";
import {CityData} from "../../engine/state/space";
import {MapKey} from "../../engine/framework/key";
import z from "zod";
import {Action, ActionZod} from "../../engine/state/action";
import {GoldsmithVariant} from "./action_selection";

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
        new Map([[Action.LOCOMOTIVE, 1], [Action.URBANIZATION, 1], [Action.GOLDSMITH, 1]]),
    );
    this.goldsmithVariant.initState(-1);
  }

  protected getPlacedGoodsFor(
      bag: Good[],
      playerCount: number,
      location: CityData,
  ): Good[] {
    const numCubes =
        location.startingNumCubes ??
        (location.startingNumCubesPerPlayer != null
            ? location.startingNumCubesPerPlayer * playerCount
            : 0);
    if (location.color === Good.BLACK) {
      // Draw 2 yellow from the bag
      return drawMatching(bag, 2, good => good === Good.YELLOW);
    }
    if (location.color instanceof Array && location.color.length === 0) {
      // Draw of any color for OP
      return draw(numCubes, bag);
    }
    // Otherwise draw non-yellows
    return drawMatching(bag, 2, good => good !== Good.YELLOW);
  }

  protected getGoodsGrowthGoodsFor(
      bag: Good[],
      cityColor: Good | Good[],
      urbanized: boolean,
  ): Array<undefined | Good> {
    if (cityColor === Good.BLACK) {
      return draw(2, bag);
    }
    return drawMatching(bag, 2, good => good !== Good.YELLOW);
  }
}

function drawMatching<T>(arr: T[], count: number, pred: (elem: T) => boolean): T[] {
  let drawn: T[] = [];
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
