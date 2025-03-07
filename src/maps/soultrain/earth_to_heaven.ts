import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { ActionProcessor } from "../../engine/game/action";
import { PhaseModule } from "../../engine/game/phase_module";
import { injectGrid } from "../../engine/game/state";
import { GridHelper } from "../../engine/map/grid_helper";
import { Land } from "../../engine/map/location";
import { GoodZod } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { CoordinatesZod } from "../../utils/coordinates";
import { assert } from "../../utils/validate";

export const TO_URBANIZE = new Key("toUrbanize", GoodZod.array());

export class EarthToHeavenPhase extends PhaseModule {
  static readonly phase = Phase.EARTH_TO_HEAVEN;

  private readonly toUrbanize = injectState(TO_URBANIZE);

  configureActions() {
    this.installAction(PlaceAction);
  }

  private skipPhase(): boolean {
    return !this.toUrbanize.isInitialized() || this.toUrbanize().length === 0;
  }

  getFirstPlayer(): PlayerColor | undefined {
    return this.skipPhase() ? undefined : this.getPlayerOrder()[0];
  }

  findNextPlayer(currentPlayer: PlayerColor): PlayerColor | undefined {
    if (this.skipPhase()) return undefined;
    return super.findNextPlayer(currentPlayer) ?? this.getFirstPlayer();
  }
}

export const PlaceData = z.object({
  coordinates: CoordinatesZod,
  city: GoodZod,
});
export type PlaceData = z.infer<typeof PlaceData>;

export class PlaceAction implements ActionProcessor<PlaceData> {
  static readonly action = "place";

  private readonly grid = injectGrid();
  private readonly gridHelper = inject(GridHelper);
  private readonly toUrbanize = injectState(TO_URBANIZE);

  assertInput = PlaceData.parse;

  validate(data: PlaceData): void {
    const space = this.grid().get(data.coordinates);
    assert(space instanceof Land && space.hasTown(), {
      invalidInput: "Must place new city where there is a town",
    });
    assert(this.toUrbanize().includes(data.city), {
      invalidInput: "invalid city chosen",
    });
  }

  process(data: PlaceData): boolean {
    const location = this.grid().get(data.coordinates)!;
    this.gridHelper.set(data.coordinates, {
      type: SpaceType.CITY,
      name: location.name()!,
      color: data.city,
      goods: [],
      urbanized: true,
      onRoll: [],
      mapSpecific: location.data.mapSpecific,
    });

    this.toUrbanize.update((cities) => {
      cities.splice(cities.indexOf(data.city));
    });
    return true;
  }
}
