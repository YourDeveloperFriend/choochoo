import z from "zod";
import { MapKey } from "../../engine/framework/key";
import { GoodZod } from "../../engine/state/good";
import { PlayerColorZod } from "../../engine/state/player";
import { MoveAction, MoveData } from "../../engine/move/move";
import { injectState, inject } from "../../engine/framework/execution_context";
import { PlayerHelper } from "../../engine/game/player";
import { Good } from "../../engine/state/good";

export const CAPTURED_CUBES = new MapKey(
  "capturedCubes",
  PlayerColorZod.parse,
  z.array(GoodZod).parse,
);

export class FourCornersMoveAction extends MoveAction<MoveData> {
  private readonly captureCubes = injectState(CAPTURED_CUBES);
  protected readonly playerHelper = inject(PlayerHelper);
  private readonly setSize = 3

  private findSetOfFour(playerCubes: Good[]): {
    hasSet: boolean;
    remainingCubes: Good[];
    completedSet?: Good[];
  } {
    const remainingCubes: Good[] = [];
    const seen = new Set<number>();
    const completedSet: Good[] = [];

    for (const cube of playerCubes) {
      if (seen.size < this.setSize && !seen.has(cube)) {
        seen.add(cube);
        completedSet.push(cube);
        continue;
      }
      remainingCubes.push(cube);
    }

    const hasSet = seen.size === this.setSize;
    return {
      hasSet,
      remainingCubes: hasSet ? remainingCubes : playerCubes,
      completedSet: hasSet ? completedSet : undefined,
    };
  }

  process(action: MoveData): boolean {
    this.captureCubes.update((cubes) => {
      const playerCubes = cubes.get(this.currentPlayer().color) || [];
      playerCubes.push(action.good);
      cubes.set(this.currentPlayer().color, playerCubes);
    });

    return super.process(action);
  }

  protected returnToBag(): void {
    this.captureCubes.update((cubes) => {
      const playerCubes = cubes.get(this.currentPlayer().color) || [];
      const { hasSet, remainingCubes, completedSet } =
        this.findSetOfFour(playerCubes);

      if (hasSet && completedSet) {
        this.bag.update((bag) => {
          bag.push(...completedSet);
        });

        this.playerHelper.updateCurrentPlayer(
          (player) => (player.income = player.income + this.setSize),
        );

        this.log.currentPlayer(
          `turns in a set of ${this.setSize} and receives ${this.setSize} income`,
        );
      }

      cubes.set(this.currentPlayer().color, remainingCubes);
    });
  }
}
