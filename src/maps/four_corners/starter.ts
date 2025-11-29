import { injectState } from "../../engine/framework/execution_context";
import { GameStarter } from "../../engine/game/starter";
import { CAPTURED_CUBES } from "./move";

export class FourCornersGameStarter extends GameStarter {
  private readonly captureCubes = injectState(CAPTURED_CUBES);

  protected onStartGame(): void {
    const initialCubes = new Map();
    for (const player of this.players()) {
      initialCubes.set(player.color, []);
    }
    this.captureCubes.initState(initialCubes);

    super.onStartGame();
  }
}
