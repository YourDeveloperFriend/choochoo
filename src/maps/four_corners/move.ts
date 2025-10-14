import z from "zod";
import { MapKey } from "../../engine/framework/key";
import { GoodZod } from "../../engine/state/good";
import { PlayerColorZod } from "../../engine/state/player";
import { MoveAction, MoveData } from "../../engine/move/move";
import { injectState } from "../../engine/framework/execution_context";
import { Good } from "../../engine/state/good";

export const CAPTURED_CUBES = new MapKey(
  "capturedCubes",
  PlayerColorZod.parse,
  z.array(GoodZod).parse,
);

export class FourCornersMoveAction extends MoveAction<MoveData> {
  private readonly captureCubes = injectState(CAPTURED_CUBES);

  process(action: MoveData): boolean {
    const set_size_needed = 4;

    this.captureCubes.update((cubes) => {
      const playerCubes = cubes.get(this.currentPlayer().color) || [];

      const result: Good[] = [];

      playerCubes.push(action.good);

      const seen = new Set<number>();

      for (const n of playerCubes) {
        if (seen.size < set_size_needed && !seen.has(n)) {
          seen.add(n);
          continue;
        }

        result.push(n);
      }

      // TO DO if set is correct size, add 4 income

      cubes.set(
        this.currentPlayer().color,
        seen.size === set_size_needed ? result : playerCubes,
      );
    });

    console.log(this.captureCubes().get(this.currentPlayer().color));

    super.process(action);

    return true;
  }
}

//   protected onStartGame(): void {
//     // Initialize empty arrays for each player
//     const initialCubes = new Map();
//     for (const player of this.players()) {
//       initialCubes.set(player.color, []);
//     }
//     this.capturedCubes.initState(initialCubes);
//   }

//   // Add captured cube
//   addCapturedCube(playerColor: PlayerColor, good: Good): void {
//     this.capturedCubes.update((cubes) => {
//       const playerCubes = cubes.get(playerColor) || [];
//       playerCubes.push(good);
//       cubes.set(playerColor, playerCubes);
//     });
//   }

//   // Get captured cubes for a player
//   getCapturedCubes(playerColor: PlayerColor): Good[] {
//     return this.capturedCubes().get(playerColor) || [];
//   }
