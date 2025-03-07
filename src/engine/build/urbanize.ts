import { z } from "zod";
import { CoordinatesZod } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { ActionProcessor } from "../game/action";
import { Log } from "../game/log";
import { AVAILABLE_CITIES, injectCurrentPlayer, injectGrid } from "../game/state";
import { GridHelper } from "../map/grid_helper";
import { Land } from "../map/location";
import { Track } from "../map/track";
import { Action } from "../state/action";
import { toLetter } from "../state/city_group";
import { SpaceType } from "../state/location_type";
import { allDirections } from "../state/tile";
import { BuilderHelper } from "./helper";
import { BUILD_STATE } from "./state";

export const UrbanizeData = z.object({
  cityIndex: z.number(),
  coordinates: CoordinatesZod,
});

export type UrbanizeData = z.infer<typeof UrbanizeData>;

export class UrbanizeAction implements ActionProcessor<UrbanizeData> {
  static readonly action = 'urbanize';
  readonly assertInput = UrbanizeData.parse;

  protected readonly currentPlayer = injectCurrentPlayer();
  protected readonly helper = inject(BuilderHelper);
  protected readonly gridHelper = inject(GridHelper);
  protected readonly grid = injectGrid();
  protected readonly buildState = injectState(BUILD_STATE);
  protected readonly availableCities = injectState(AVAILABLE_CITIES);
  protected readonly log = inject(Log);

  canEmit(): boolean {
    return this.currentPlayer().selectedAction === Action.URBANIZATION && !this.buildState().hasUrbanized;
  }

  validate(data: UrbanizeData): void {
    const space = this.gridHelper.lookup(data.coordinates);
    assert(space instanceof Land, 'can only urbanize in town locations');
    assert(space.hasTown(), 'can only urbanize in town locations');
    const city = this.availableCities()[data.cityIndex];
    assert(city != null, `Available city doesn't exist at ${data.cityIndex}`);
  }

  process(data: UrbanizeData): boolean {
    this.buildState.update((state) => state.hasUrbanized = true);
    const city = this.availableCities()[data.cityIndex];

    const location = this.gridHelper.lookup(data.coordinates) as Land;

    this.availableCities.update((cities) => cities.splice(data.cityIndex, 1));
    this.gridHelper.set(data.coordinates, {
      type: SpaceType.CITY,
      name: location.name()!,
      color: city.color,
      goods: city.goods.concat(location.getGoods()),
      urbanized: true,
      onRoll: city.onRoll,
      mapSpecific: location.data.mapSpecific,
    });

    // Take ownership of connecting unowned track.
    for (const direction of allDirections) {
      const connection = this.grid().connection(data.coordinates, direction);
      if (!(connection instanceof Track) || connection.getOwner() != null) continue;

      this.gridHelper.setRouteOwner(connection);
    }

    this.log.currentPlayer(`places city ${toLetter(city.onRoll[0])} in ${location.name() ?? this.grid().displayName(data.coordinates)}`);
    return this.helper.isAtEndOfTurn();
  }
}