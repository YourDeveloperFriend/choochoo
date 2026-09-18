import { injectState } from "../../engine/framework/execution_context";
import { GameStarter } from "../../engine/game/starter";
import { WyomingLocoDiscs } from "./locomotive";

export class WyomingStarter extends GameStarter {
  private readonly locoDiscs = injectState(WyomingLocoDiscs);

  protected onStartGame(): void {
    super.onStartGame();
    this.locoDiscs.initState(
      new Map(this.turnOrder().map((color) => [color, 0])),
    );
  }
}
