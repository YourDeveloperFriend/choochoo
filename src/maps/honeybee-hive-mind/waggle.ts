import { WAGGLE_DANCE_PHASE } from "./phases";
import { WAGGLE_DANCE } from "./actions";
import z from "zod";
import { CoordinatesZod } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { inject } from "../../engine/framework/execution_context";
import { ActionProcessor } from "../../engine/game/action";
import { PhaseModule } from "../../engine/game/phase_module";
import { Log } from "../../engine/game/log";
import { injectGrid, injectPlayerAction } from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { GridHelper } from "../../engine/map/grid_helper";
import { Good } from "../../engine/state/good";

export const WaggleData = z.object({
  moves: z.array(z.object({ from: CoordinatesZod, to: CoordinatesZod })).max(3),
});
export type WaggleData = z.infer<typeof WaggleData>;

export function canonicalCity(grid: Grid, city: City): City {
  return (
    grid.getSameCities(city).find((half) => half.onRoll().length > 0) ?? city
  );
}

function validateWaggle(grid: Grid, data: WaggleData): void {
  const destinations = new Set<string>();
  const sourceCounts = new Map<string, number>();
  for (const move of data.moves) {
    const from = grid.get(move.from),
      to = grid.get(move.to);
    assert(from instanceof City && to instanceof City, {
      invalidInput: "Choose board Cities for Waggle Dance",
    });
    assert(!from.isSameCity(to), {
      invalidInput: "Relocate each bee to another City",
    });
    const destination = canonicalCity(grid, to).coordinates.serialize();
    assert(!destinations.has(destination), {
      invalidInput: "Each relocated bee must have a different destination City",
    });
    destinations.add(destination);
    const source = canonicalCity(grid, from).coordinates.serialize();
    const used = (sourceCounts.get(source) ?? 0) + 1;
    sourceCounts.set(source, used);
    const available = grid
      .getSameCities(from)
      .reduce(
        (sum, half) =>
          sum + half.getGoods().filter((g) => g === Good.YELLOW).length,
        0,
      );
    assert(used <= available, {
      invalidInput:
        "Choose bees present before Waggle Dance; each cube moves only once",
    });
  }
}

export class WaggleAction implements ActionProcessor<WaggleData> {
  static readonly action = "honeybee-waggle";
  readonly assertInput = WaggleData.parse;
  private readonly grid = injectGrid();
  private readonly gridHelper = inject(GridHelper);
  private readonly log = inject(Log);
  validate(data: WaggleData): void {
    validateWaggle(this.grid(), data);
  }
  process(data: WaggleData): boolean {
    // Remove every source first, then add every destination: arrivals cannot be moved again.
    const original = this.grid();
    for (const move of data.moves) {
      const from = original.get(move.from) as City;
      const source = this.grid()
        .getSameCities(from)
        .find((half) => half.getGoods().includes(Good.YELLOW))!;
      this.gridHelper.update(source.coordinates, (space) =>
        space.goods!.splice(space.goods!.indexOf(Good.YELLOW), 1),
      );
    }
    for (const move of data.moves) {
      const destination = canonicalCity(
        original,
        original.get(move.to) as City,
      );
      this.gridHelper.update(destination.coordinates, (space) =>
        space.goods!.push(Good.YELLOW),
      );
      this.log.currentPlayer(
        `relocates a bee from ${original.displayName(move.from)} to ${original.displayName(destination.coordinates)}`,
      );
    }
    if (data.moves.length === 0) {
      this.log.currentPlayer("declines Waggle Dance");
    }
    return true;
  }
}

export class WagglePhase extends PhaseModule {
  static readonly phase = WAGGLE_DANCE_PHASE;
  private readonly selected = injectPlayerAction(WAGGLE_DANCE);
  configureActions(): void {
    this.installAction(WaggleAction);
  }
  getPlayerOrder() {
    const player = this.selected();
    return player ? [player.color] : [];
  }
}
