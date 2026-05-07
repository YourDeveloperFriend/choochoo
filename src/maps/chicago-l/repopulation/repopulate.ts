import z from "zod";
import {
  inject,
  injectState,
} from "../../../engine/framework/execution_context";
import { ActionProcessor } from "../../../engine/game/action";
import { Log } from "../../../engine/game/log";
import { injectCurrentPlayer, injectGrid } from "../../../engine/game/state";
import { City } from "../../../engine/map/city";
import { GridHelper } from "../../../engine/map/grid_helper";
import { Action } from "../../../engine/state/action";
import { goodToString, GoodZod } from "../../../engine/state/good";
import { SpaceType } from "../../../engine/state/location_type";
import { CoordinatesZod } from "../../../utils/coordinates";
import { assert } from "../../../utils/validate";
import { REPOPULATION_BOX } from "../starter";

export const RepopulateData = z.object({
  coordinates: CoordinatesZod,
  good: GoodZod,
});
export type RepopulateData = z.infer<typeof RepopulateData>;

export class RepopulateAction implements ActionProcessor<RepopulateData> {
  static readonly action = "chicagol_repopulate";
  protected readonly log = inject(Log);
  private readonly grid = injectGrid();
  private readonly gridHelper = inject(GridHelper);
  private readonly repopulationBox = injectState(REPOPULATION_BOX);
  private readonly currentPlayer = injectCurrentPlayer();

  readonly assertInput = RepopulateData.parse;

  canEmit(): boolean {
    return this.currentPlayer().selectedAction === Action.REPOPULATION;
  }

  validate({ coordinates, good }: RepopulateData): void {
    assert(this.repopulationBox().includes(good), {
      invalidInput: "must select a good you drew",
    });
    assert(this.grid().get(coordinates) instanceof City, {
      invalidInput: "must be placed in a city",
    });
  }

  process({ coordinates, good }: RepopulateData): boolean {
    this.gridHelper.update(coordinates, (space) => {
      assert(space.type === SpaceType.CITY);
      space.goods.push(good);
    });

    const city = this.grid().get(coordinates);
    assert(city instanceof City);
    this.log.currentPlayer(`places a ${goodToString(good)} in ${city.name()}`);

    this.repopulationBox.update((repopulation) => {
      const index = repopulation.indexOf(good);
      assert(index >= 0);
      repopulation.splice(index, 1);
    });
    return true;
  }
}
