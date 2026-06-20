import { z } from "zod";
import { Coordinates, CoordinatesZod } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { ActionProcessor } from "../game/action";
import { Log } from "../game/log";
import { MoneyManager } from "../game/money_manager";
import { PlayerHelper } from "../game/player";
import { injectCurrentPlayer, injectGrid } from "../game/state";
import { GridHelper } from "../map/grid_helper";
import { calculateTrackInfo, Land } from "../map/location";
import { TOWN } from "../map/track";
import { SpaceType } from "../state/location_type";
import { PlayerColor } from "../state/player";
import { Direction, getTileTypeString, TileData, TileType } from "../state/tile";
import { BuildCostCalculator } from "./cost";
import { BuildDiscountManager } from "./discount";
import { BuilderHelper } from "./helper";
import { BUILD_STATE } from "./state";
import { Validator } from "./validator";

export const BuildData = z.object({
  coordinates: CoordinatesZod,
  tileType: TileType,
  orientation: z.nativeEnum(Direction),
});

export type BuildData = z.infer<typeof BuildData>;

export class BuildAction implements ActionProcessor<BuildData> {
  static readonly action = 'build';
  readonly assertInput = BuildData.parse;

  protected readonly buildState = injectState(BUILD_STATE);
  protected readonly currentPlayer = injectCurrentPlayer();
  protected readonly grid = injectGrid();
  protected readonly gridHelper = inject(GridHelper);
  protected readonly helper = inject(BuilderHelper);
  protected readonly costCalculator = inject(BuildCostCalculator);
  protected readonly discountManager = inject(BuildDiscountManager);
  protected readonly playerHelper = inject(PlayerHelper);
  protected readonly validator = inject(Validator);
  protected readonly moneyManager = inject(MoneyManager);
  protected readonly log = inject(Log);

  protected owningPlayer(): PlayerColor {
    return this.currentPlayer().color;
  }

  protected originalCostOf(build: BuildData): number {
    return this.costCalculator.costOf(build.coordinates, build.tileType, build.orientation);
  }

  totalCostOf(build: BuildData): number {
    const cost = this.originalCostOf(build);
    const discount = this.discountManager.getDiscount(build, cost);
    return cost - discount;
  }

  validate(data: BuildData): void {
    const coordinates: Coordinates = data.coordinates;

    const maxTrack = this.helper.getMaxBuilds();
    assert(this.helper.buildsRemaining() > 0, { invalidInput: `You can only build at most ${maxTrack} track` });

    assert(this.currentPlayer().money >= this.totalCostOf(data), { invalidInput: 'Cannot afford to place track' });

    assert(!this.hasBuiltHere(coordinates), { invalidInput: 'cannot build in the same location twice in one turn' });
    const invalidBuildReason = this.validator.getInvalidBuildReason(coordinates, { ...data, playerColor: this.owningPlayer() });
    assert(invalidBuildReason == null, { invalidInput: 'Invalid build: ' + invalidBuildReason });
  }

  process(data: BuildData): boolean {
    const coordinates = data.coordinates;
    const totalCost = this.totalCostOf(data);
    this.moneyManager.addMoneyForCurrentPlayer(-totalCost);
    this.discountManager.applyDiscount(data, this.originalCostOf(data));
    const newTile = this.newTile(data);
    this.log.currentPlayer(`builds a ${getTileTypeString(data.tileType)} at ${this.grid().displayName(data.coordinates)} for $${totalCost}`);
    this.gridHelper.update(coordinates, (hex) => {
      assert(hex.type !== SpaceType.CITY);
      hex.tile = newTile;
    });
    const location = this.gridHelper.lookup(coordinates);
    assert(location instanceof Land);

    for (const track of location.getTrack()) {
      if (track.getOwner() === this.owningPlayer()) {
        this.gridHelper.setRouteOwner(track, this.owningPlayer());
      }
    }

    this.buildState.update((buildState) => {
      buildState.previousBuilds.push(coordinates);
      // TODO: remove the call to previousBuilds and just rely on buildCount, once all games have migrated.
      buildState.buildCount = (buildState.buildCount ?? buildState.previousBuilds.length) + 1;
    });

    this.helper.checkOwnershipMarkerLimits();

    return this.helper.isAtEndOfTurn();
  }

  protected newTile(data: BuildData): TileData {
    const newTileData = calculateTrackInfo(data);
    const oldTrack = this.gridHelper.lookup(data.coordinates);
    assert(oldTrack instanceof Land);
    const owners = newTileData.map((newTrack) => {
      const previousTrack = oldTrack.getTrack().find((track) =>
        track.getExits().some((exit) => exit !== TOWN && newTrack.exits.includes(exit)));
      if (previousTrack != null) {
        if (previousTrack.getOwner() != null) {
          return previousTrack.getOwner()!;
        }
        if (previousTrack.getExits().every((exit) => newTrack.exits.includes(exit))) {
          return undefined;
        }
      }

      return this.owningPlayer();
    });

    return {
      tileType: data.tileType,
      orientation: data.orientation,
      owners,
    };
  }

  protected hasBuiltHere(coordinates: Coordinates): boolean {
    // you can't build two tiles in the same location in one turn
    for (const previousCoordinates of this.buildState().previousBuilds) {
      if (Coordinates.from(previousCoordinates).equals(coordinates)) {
        return true;
      }
    }
    return false;
  }
}