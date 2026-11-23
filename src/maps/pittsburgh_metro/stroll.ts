import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import {
  ActionProcessor,
  EmptyActionProcessor,
} from "../../engine/game/action";
import { PHASE } from "../../engine/game/phase";
import { Log } from "../../engine/game/log";
import { injectCurrentPlayer, injectGrid } from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { GridHelper } from "../../engine/map/grid_helper";
import { SelectAction, SelectData } from "../../engine/select_action/select";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { goodToString, GoodZod } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { Coordinates, CoordinatesZod } from "../../utils/coordinates";
import { assert } from "../../utils/validate";

export const STROLL = Action.MAP_CUSTOM_ACTION_1;

const STROLL_MAX_DISTANCE = 3;

function hexDistance(a: Coordinates, b: Coordinates): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

export class PittsburghMetroSelectAction extends SelectAction {
  private readonly grid = injectGrid();

  canEmit(): boolean {
    // Once an action is selected the player can only finish it (e.g. stroll).
    return this.currentPlayer().selectedAction === undefined;
  }

  process(data: SelectData): boolean {
    const result = super.process(data);
    if (data.action === STROLL) {
      return false;
    }
    return result;
  }
}

export const StrollData = z.object({
  from: CoordinatesZod,
  to: CoordinatesZod,
  good: GoodZod,
});
export type StrollData = z.infer<typeof StrollData>;

export class StrollAction implements ActionProcessor<StrollData> {
  static readonly action = "pittsburgh-metro-stroll";
  readonly assertInput = StrollData.parse;

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly phase = injectState(PHASE);
  private readonly grid = injectGrid();
  private readonly gridHelper = inject(GridHelper);
  private readonly log = inject(Log);

  canEmit(): boolean {
    return (
      this.phase() === Phase.ACTION_SELECTION &&
      this.currentPlayer().selectedAction === STROLL
    );
  }

  validate({ from, to, good }: StrollData): void {
    const fromCity = this.grid().get(from);
    const toCity = this.grid().get(to);
    assert(fromCity instanceof City && toCity instanceof City, {
      invalidInput: "must move a cube between two cities",
    });
    assert(!from.equals(to), {
      invalidInput: "must move to a different city",
    });
    assert(hexDistance(from, to) <= STROLL_MAX_DISTANCE, {
      invalidInput: `cities must be within ${STROLL_MAX_DISTANCE} hexes`,
    });
    assert(fromCity.getGoods().includes(good), {
      invalidInput: "that city does not have a cube of that color",
    });
  }

  process({ from, to, good }: StrollData): boolean {
    this.gridHelper.update(from, (space) => {
      assert(space.type === SpaceType.CITY);
      assert(space.goods != null);
      const index = space.goods.indexOf(good);
      assert(index >= 0);
      space.goods.splice(index, 1);
    });
    this.gridHelper.update(to, (space) => {
      assert(space.type === SpaceType.CITY);
      if (space.goods == null) {
        space.goods = [];
      }
      space.goods.push(good);
    });
    this.log.currentPlayer(
      `strolls a ${goodToString(good)} cube from ${this.gridHelper.displayName(from)} to ${this.gridHelper.displayName(to)}`,
    );
    return true;
  }
}

export class SkipStrollAction extends EmptyActionProcessor {
  static readonly action = "pittsburgh-metro-skip-stroll";

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly phase = injectState(PHASE);
  private readonly log = inject(Log);

  canEmit(): boolean {
    return (
      this.phase() === Phase.ACTION_SELECTION &&
      this.currentPlayer().selectedAction === STROLL
    );
  }

  process(): boolean {
    this.log.currentPlayer("chooses not to stroll");
    return true;
  }
}
