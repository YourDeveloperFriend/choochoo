import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import z from "zod";
import { CoordinatesZod } from "../../utils/coordinates";
import { ActionProcessor } from "../../engine/game/action";
import { GridHelper } from "../../engine/map/grid_helper";
import { assert } from "../../utils/validate";
import { City } from "../../engine/map/city";
import { BuildPhase } from "../../engine/build/phase";
import { ROUND } from "../../engine/game/round";
import { DoubleBaseUsaMapData } from "./grid";
import { SpaceType } from "../../engine/state/location_type";
import { injectCurrentPlayer } from "../../engine/game/state";
import { GoodZod } from "../../engine/state/good";
import { StartingCityMarkers } from "./starter";
import { DoubleBaseUsaSpendLandGrantAction, URBANIZE_COUNT } from "./build";

export const SELECT_STARTING_CITY_REQUIRED = new Key(
  "selectStartingCityRequired",
  z.boolean(),
);

export const LAND_GRANT_BUILD_STATE = new Key("landGrantBuildState", {
  parse: z.object({
    totalSpent: z.number(),
    spentNow: z.boolean(),
  }).parse,
});

export class DoubleBaseUsaBuildPhase extends BuildPhase {
  private readonly selectStartingCityRequired = injectState(
    SELECT_STARTING_CITY_REQUIRED,
  );
  private readonly landGrantBuildState = injectState(LAND_GRANT_BUILD_STATE);
  private readonly urbanizeCount = injectState(URBANIZE_COUNT);
  private readonly round = injectState(ROUND);

  configureActions(): void {
    super.configureActions();
    this.installAction(SelectStartingCityAction);
    this.installAction(DoubleBaseUsaSpendLandGrantAction);
  }
  onStartTurn() {
    super.onStartTurn();
    this.selectStartingCityRequired.initState(this.round() === 1);
    this.urbanizeCount.initState(0);
    this.landGrantBuildState.initState({ totalSpent: 0, spentNow: false });
  }
  onEndTurn() {
    this.selectStartingCityRequired.delete();
    this.urbanizeCount.delete();
    this.landGrantBuildState.delete();
    super.onEndTurn();
  }
}

export const SelectStartingCityData = z.object({
  coordinates: CoordinatesZod,
  color: GoodZod.optional(),
});
export type SelectStartingCityData = z.infer<typeof SelectStartingCityData>;

export class SelectStartingCityAction
  implements ActionProcessor<SelectStartingCityData>
{
  static readonly action = "double-base-usa-select-starting-city";
  readonly assertInput = SelectStartingCityData.parse;

  private readonly selectStartingCityRequired = injectState(
    SELECT_STARTING_CITY_REQUIRED,
  );
  private readonly startingCityMarkers = injectState(StartingCityMarkers);
  private readonly gridHelper = inject(GridHelper);
  private readonly currentPlayer = injectCurrentPlayer();

  canEmit(): boolean {
    return this.selectStartingCityRequired() === true;
  }

  validate(data: SelectStartingCityData) {
    const city = this.gridHelper.lookup(data.coordinates);
    assert(city instanceof City, {
      invalidInput: "must select a starting city",
    });
    const mapSpecific = city.getMapSpecific(DoubleBaseUsaMapData.parse);
    assert(mapSpecific !== undefined && mapSpecific.startingCity === true, {
      invalidInput: "must select a starting city",
    });
    assert(mapSpecific.startingPlayer === undefined, {
      invalidInput:
        "cannot select a starting city already picked by another player",
    });

    const startingCityMarkers = this.startingCityMarkers();
    if (startingCityMarkers.length === 0) {
      assert(data.color === undefined, {
        invalidInput: "no color should be selected for the final starting city",
      });
    } else {
      assert(
        startingCityMarkers.some((marker) => marker === data.color),
        { invalidInput: "must select an available starting city marker" },
      );
    }
  }

  process(data: SelectStartingCityData): boolean {
    const currentPlayer = this.currentPlayer();
    const isMontreal =
      this.gridHelper.lookup(data.coordinates)?.name() === "Montreal";
    this.gridHelper.update(data.coordinates, (space) => {
      (space.mapSpecific as DoubleBaseUsaMapData).startingPlayer =
        currentPlayer.color;
      if (!isMontreal && data.color !== undefined) {
        assert(space.type === SpaceType.CITY);
        space.color = data.color;
      }
    });
    if (!isMontreal && data.color !== undefined) {
      this.startingCityMarkers.update((prior) => {
        assert(data.color !== undefined);
        const index = prior.indexOf(data.color);
        assert(index !== -1);
        prior.splice(index, 1);
      });
    }
    this.selectStartingCityRequired.set(false);
    return false;
  }
}
