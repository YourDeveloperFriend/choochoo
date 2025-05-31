import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { ActionProcessor } from "../../engine/game/action";
import { City } from "../../engine/map/city";
import { GridHelper } from "../../engine/map/grid_helper";
import { SelectActionPhase } from "../../engine/select_action/phase";
import { SelectAction, SelectData } from "../../engine/select_action/select";
import { Action } from "../../engine/state/action";
import { Good } from "../../engine/state/good";
import { CoordinatesZod } from "../../utils/coordinates";
import { assert } from "../../utils/validate";

const WHITE_CUBES_REMAINING = new Key("whiteCubesRemaining", {
  parse: z.number().parse,
});

export class DCSelectAction extends SelectAction {
  private readonly whiteCubesRemaining = injectState(WHITE_CUBES_REMAINING);

  canEmit(): boolean {
    return !this.whiteCubesRemaining.isInitialized();
  }

  process(data: SelectData): boolean {
    super.process(data);

    if (data.action !== Action.PRODUCTION) {
      return true;
    }

    this.whiteCubesRemaining.initState(2);
    return false;
  }
}

export class DCSelectActionPhase extends SelectActionPhase {
  configureActions(): void {
    super.configureActions();
    this.installAction(PlaceWhiteCubeAction);
  }
}

export const PlaceWhiteCubeData = z.object({
  coordinates: CoordinatesZod,
});
export type PlaceWhiteCubeData = z.infer<typeof PlaceWhiteCubeData>;

export class PlaceWhiteCubeAction
  implements ActionProcessor<PlaceWhiteCubeData>
{
  static readonly action = "place-white-cube";
  private readonly gridHelper = inject(GridHelper);
  private readonly whiteCubesRemaining = injectState(WHITE_CUBES_REMAINING);

  assertInput = PlaceWhiteCubeData.parse;

  canEmit(): boolean {
    return this.whiteCubesRemaining.isInitialized();
  }

  validate(data: PlaceWhiteCubeData): void {
    const location = this.gridHelper.lookup(data.coordinates);
    assert(location instanceof City || (location?.hasTown() ?? false), {
      invalidInput: "must place in town or city",
    });
  }

  process(data: PlaceWhiteCubeData): boolean {
    this.gridHelper.update(data.coordinates, (space) => {
      space.goods = [...(space.goods ?? []), Good.WHITE];
    });
    if (this.whiteCubesRemaining() > 1) {
      this.whiteCubesRemaining.set(this.whiteCubesRemaining() - 1);
      return false;
    }
    this.whiteCubesRemaining.delete();
    return true;
  }
}
