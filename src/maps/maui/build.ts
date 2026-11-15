import z from "zod";
import { BuildAction, BuildData } from "../../engine/build/build";
import { BuildCostCalculator } from "../../engine/build/cost";
import { BuildPhase } from "../../engine/build/phase";
import { BuildDiscountManager } from "../../engine/build/discount";
import { BuilderHelper } from "../../engine/build/helper";
import { BUILD_STATE } from "../../engine/build/state";
import {
  BuildInfo,
  InvalidBuildReason,
  Validator,
} from "../../engine/build/validator";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { ROUND } from "../../engine/game/round";
import { injectCurrentPlayer, injectGrid } from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import {
  calculateTrackInfo,
  countExits,
  Land,
  partitionTracks,
} from "../../engine/map/location";
import { isComplexTile, isTownTile } from "../../engine/map/tile";
import { TOWN } from "../../engine/map/track";
import { SpaceType } from "../../engine/state/location_type";
import { LandType } from "../../engine/state/space";
import {
  Direction,
  SimpleTileType,
  TileType,
  TownTileType,
} from "../../engine/state/tile";
import { Coordinates, CoordinatesZod } from "../../utils/coordinates";
import { COASTAL_ENGINEER, NATIONAL_PARKWAY_ENGINEER } from "./actions";
import { MauiLandData } from "./map_data";

const BEACH_COST = 13;
const COASTAL_BEACH_COST = 3;
const MOUNTAIN_COST = 6;
const PARKWAY_MOUNTAIN_COST = 4;
const COST_PER_TOWN_EXIT = 2;
const MAX_TOWN_EXITS_PER_TURN = 2;
const CITY_LIMIT_THROUGH_ROUND = 2;
const ENGINEER_MAX_BUILDS = 4;

function fixedTileCost(land: Land): MauiLandData["fixedTileCost"] {
  return land.getMapSpecific(MauiLandData.parse)?.fixedTileCost;
}

function exitsAdded(land: Land, newTileType: TownTileType): number {
  const previous = land.getTileType();
  const previousExits =
    previous != null && isTownTile(previous) ? countExits(previous) : 0;
  return countExits(newTileType) - previousExits;
}

export class MauiBuildCostCalculator extends BuildCostCalculator {
  costOf(
    coordinates: Coordinates,
    newTileType: TileType,
    orientation: Direction,
  ): number {
    const land = this.grid().get(coordinates);
    if (land instanceof Land) {
      // Variable-price hexes: the higher price only applies to a straight tile connecting the
      // two cities on either side of the hex. Any other tile costs the lower price.
      if (!land.hasTile()) {
        const fixed = fixedTileCost(land);
        if (fixed != null) {
          return this.connectsCitiesInStraightLine(
            coordinates,
            newTileType,
            orientation,
          )
            ? fixed.straight
            : fixed.curve;
        }
      }
      // Town upgrades cost $2 per exit added.
      if (land.hasTown() && land.hasTile() && isTownTile(newTileType)) {
        return COST_PER_TOWN_EXIT * exitsAdded(land, newTileType);
      }
    }
    return super.costOf(coordinates, newTileType, orientation);
  }

  private connectsCitiesInStraightLine(
    coordinates: Coordinates,
    tileType: TileType,
    orientation: Direction,
  ): boolean {
    if (tileType !== SimpleTileType.STRAIGHT) {
      return false;
    }
    return calculateTrackInfo({ tileType, orientation }).every(({ exits }) =>
      exits.every(
        (exit) =>
          exit !== TOWN &&
          this.grid().getNeighbor(coordinates, exit) instanceof City,
      ),
    );
  }

  protected getTownTileCost(tileType: TownTileType): number {
    return COST_PER_TOWN_EXIT * countExits(tileType);
  }

  protected getCostOfLandType(type: LandType): number {
    switch (type) {
      // Beach is DESERT and forest is HILL; see grid.ts.
      case SpaceType.DESERT:
        return BEACH_COST;
      case SpaceType.PLAIN:
        return 4;
      case SpaceType.HILL:
        return 5;
      case SpaceType.MOUNTAIN:
        return MOUNTAIN_COST;
      default:
        return super.getCostOfLandType(type);
    }
  }
}

export class MauiBuilderHelper extends BuilderHelper {
  getMaxBuilds(): number {
    if (
      this.currentPlayer().selectedAction === COASTAL_ENGINEER ||
      this.currentPlayer().selectedAction === NATIONAL_PARKWAY_ENGINEER
    ) {
      return ENGINEER_MAX_BUILDS;
    }
    return 3;
  }
}

/**
 * Coastal Engineer: beaches cost $3, but if the player uses their fourth build they
 * retroactively pay back every beach discount received that turn.
 */
const COASTAL_DISCOUNT_GIVEN = new Key("mauiCoastalDiscountGiven", {
  parse: z.object({ total: z.number() }).parse,
});

export class MauiDiscountManager extends BuildDiscountManager {
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly grid = injectGrid();
  private readonly buildState = injectState(BUILD_STATE);
  private readonly given = injectState(COASTAL_DISCOUNT_GIVEN);

  private isCoastal(): boolean {
    return this.currentPlayer().selectedAction === COASTAL_ENGINEER;
  }

  private isParkway(): boolean {
    return this.currentPlayer().selectedAction === NATIONAL_PARKWAY_ENGINEER;
  }

  private isFinalBuild(): boolean {
    const state = this.buildState();
    const built = state.buildCount ?? state.previousBuilds.length;
    return built + 1 >= ENGINEER_MAX_BUILDS;
  }

  private beachDiscount(data: BuildData, cost: number): number {
    const land = this.grid().get(data.coordinates);
    if (
      !(land instanceof Land) ||
      land.hasTile() ||
      land.getLandType() !== SpaceType.DESERT
    ) {
      return 0;
    }
    return Math.min(cost, BEACH_COST - COASTAL_BEACH_COST);
  }

  private mountainDiscount(data: BuildData, cost: number): number {
    const land = this.grid().get(data.coordinates);
    if (
      !(land instanceof Land) ||
      land.hasTile() ||
      land.getLandType() !== SpaceType.MOUNTAIN
    ) {
      return 0;
    }
    return Math.min(cost, MOUNTAIN_COST - PARKWAY_MOUNTAIN_COST);
  }

  getDiscount(data: BuildData, cost: number): number {
    if (this.isParkway()) {
      return this.mountainDiscount(data, cost);
    }
    if (!this.isCoastal()) {
      return super.getDiscount(data, cost);
    }
    // A negative discount charges back what was previously saved.
    if (this.isFinalBuild()) {
      return 0 - this.given.getOr({ total: 0 }).total;
    }
    return this.beachDiscount(data, cost);
  }

  applyDiscount(data: BuildData, cost: number): void {
    if (!this.isCoastal()) {
      return super.applyDiscount(data, cost);
    }
    if (this.isFinalBuild()) {
      return;
    }
    this.given.upsert({
      total:
        this.given.getOr({ total: 0 }).total + this.beachDiscount(data, cost),
    });
  }

  onBuildRoundEnd(): void {
    if (this.given.isInitialized()) {
      this.given.delete();
    }
    super.onBuildRoundEnd();
  }
}

/** The cities the current player has built a new link into or out of during this build turn. */
const CITY_BUILDS = new Key("mauiCityBuilds", {
  parse: z.array(CoordinatesZod).parse,
});

export class MauiBuildPhase extends BuildPhase {
  private readonly cityBuilds = injectState(CITY_BUILDS);

  onStartTurn(): void {
    super.onStartTurn();
    this.cityBuilds.initState([]);
  }

  onEndTurn(): void {
    this.cityBuilds.delete();
    super.onEndTurn();
  }
}

/** The cities a build would add a new link to, once per new link. */
function citiesLinkedBy(
  grid: Grid,
  coordinates: Coordinates,
  tileType: TileType,
  orientation: Direction,
): City[] {
  const space = grid.get(coordinates);
  if (!(space instanceof Land)) {
    return [];
  }
  const { newTracks, rerouted } = partitionTracks(
    space,
    calculateTrackInfo({ tileType, orientation }),
  );
  return [...newTracks, ...rerouted]
    .flatMap((track) => track.exits)
    .filter((exit) => exit !== TOWN)
    .map((exit) => grid.getNeighbor(coordinates, exit))
    .filter((neighbor): neighbor is City => neighbor instanceof City);
}

export class MauiValidator extends Validator {
  private readonly round = injectState(ROUND);
  private readonly cityBuilds = injectState(CITY_BUILDS);

  getInvalidBuildReason(
    coordinates: Coordinates,
    buildData: BuildInfo,
  ): InvalidBuildReason | undefined {
    const land = this.grid().get(coordinates);
    if (
      land instanceof Land &&
      !land.hasTile() &&
      land.getMapSpecific(MauiLandData.parse)?.noInitialComplexTrack === true &&
      isComplexTile(buildData.tileType)
    ) {
      return "cannot initially place complex track on this hex";
    }
    const reason = super.getInvalidBuildReason(coordinates, buildData);
    if (reason != null) {
      return reason;
    }

    if (
      land instanceof Land &&
      land.hasTown() &&
      isTownTile(buildData.tileType) &&
      exitsAdded(land, buildData.tileType) > MAX_TOWN_EXITS_PER_TURN
    ) {
      return `cannot add more than ${MAX_TOWN_EXITS_PER_TURN} exits to a town in one turn`;
    }
    return this.cityLimitReason(coordinates, buildData);
  }

  /** Turns 1-2: a player may only build into or out of each city once per turn. */
  private cityLimitReason(
    coordinates: Coordinates,
    buildData: BuildInfo,
  ): InvalidBuildReason | undefined {
    if (this.round() > CITY_LIMIT_THROUGH_ROUND) {
      return undefined;
    }
    const used = new Set(this.cityBuilds.getOr([]));
    for (const city of citiesLinkedBy(
      this.grid(),
      coordinates,
      buildData.tileType,
      buildData.orientation,
    )) {
      if (used.has(city.coordinates)) {
        return `can only build into or out of ${city.name()} once per turn`;
      }
      used.add(city.coordinates);
    }
    return undefined;
  }
}

export class MauiBuildAction extends BuildAction {
  private readonly cityBuilds = injectState(CITY_BUILDS);

  process(data: BuildData): boolean {
    // Computed before the tile is placed, since it compares against the old track.
    const linked = citiesLinkedBy(
      this.grid(),
      data.coordinates,
      data.tileType,
      data.orientation,
    ).map((city) => city.coordinates);
    const result = super.process(data);
    this.cityBuilds.update((cities) => {
      cities.push(...linked);
    });
    return result;
  }
}
