import { injectState } from "../../engine/framework/execution_context";
import { draw, GameStarter } from "../../engine/game/starter";
import { WyomingLocoDiscs } from "./locomotive";
import { Good } from "../../engine/state/good";

export class WyomingStarter extends GameStarter {
  private readonly locoDiscs = injectState(WyomingLocoDiscs);

  protected onStartGame(): void {
    super.onStartGame();
    this.locoDiscs.initState(
      new Map(this.turnOrder().map((color) => [color, 0])),
    );
  }

  protected getGoodsGrowthGoodsFor(
    bag: Good[],
    _cityColor: Good | Good[],
    _urbanized: boolean,
  ): Array<undefined | Good> {
    return draw(2, bag);
  }
}
