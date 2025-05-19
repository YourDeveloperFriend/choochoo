import { z } from "zod";
import { CoordinatesZod } from "../../utils/coordinates";
import { partition, peek } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { ActionProcessor } from "../game/action";
import { Log } from "../game/log";
import {
  BAG,
  injectAllPlayersUnsafe,
  injectCurrentPlayer,
  injectGrid,
} from "../game/state";
import { GridHelper } from "../map/grid_helper";
import { Good, goodToString } from "../state/good";
import { PlayerColor } from "../state/player";
import { MoveHelper } from "./helper";
import { MoveValidator } from "./validator";

export const Path = z.object({
  owner: z.nativeEnum(PlayerColor).optional(),
  endingStop: CoordinatesZod,
});

export type Path = z.infer<typeof Path>;

export const MoveData = z.object({
  // Indicates a path where the first coordinate is the starting
  // city, and the last is the end.
  path: z.array(Path),
  startingCity: CoordinatesZod,
  good: z.nativeEnum(Good),
});

export type MoveData = z.infer<typeof MoveData>;

export class MoveAction<T extends MoveData = MoveData>
  implements ActionProcessor<T>
{
  static readonly action = "move";
  protected readonly currentPlayer = injectCurrentPlayer();
  protected readonly gridHelper = inject(GridHelper);
  protected readonly grid = injectGrid();
  protected readonly log = inject(Log);
  protected readonly bag = injectState(BAG);
  protected readonly players = injectAllPlayersUnsafe();
  protected readonly moveHelper = inject(MoveHelper);
  protected readonly validator = inject(MoveValidator);

  assertInput(data: unknown): T {
    return MoveData.parse(data) as T;
  }

  canEmit(): boolean {
    return true;
  }

  validate(action: T): void {
    this.validator.validate(action);
  }

  calculateIncome(action: T): Map<PlayerColor | undefined, number> {
    return new Map(
      [...partition(action.path, (step) => step.owner).entries()].map(
        ([owner, steps]) => [owner, steps.length],
      ),
    );
  }

  process(action: T): boolean {
    this.gridHelper.update(action.startingCity, (location) => {
      assert(location.goods != null);
      location.goods.splice(location.goods.indexOf(action.good), 1);
    });

    this.log.currentPlayer(
      `moves a ${goodToString(action.good)} good from ${this.grid().displayName(action.startingCity)} to ${this.grid().displayName(peek(action.path).endingStop)}`,
    );

    const income = this.calculateIncome(action);

    this.players.update((players) => {
      for (const player of players) {
        if (!income.has(player.color)) continue;
        assert(
          !player.outOfGame,
          "unexpected out of game player still owns track",
        );
        const incomeBonus = income.get(player.color) ?? 0;
        this.log.player(player, `earns ${incomeBonus} income`);
        player.income += incomeBonus;
      }
    });
    this.returnToBag(action);
    return true;
  }

  protected returnToBag(action: MoveData): void {
    this.bag.update((goods) => goods.push(action.good));
  }
}
