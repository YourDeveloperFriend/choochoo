import { Map as ImmutableMap } from "immutable";
import { z } from "zod";
import { Coordinates, CoordinatesZod } from "../../utils/coordinates";
import { deepEquals } from "../../utils/deep_equals";
import { DoubleHeight } from "../../utils/double_height";
import { isNotNull } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { MapSettings } from "../game/map_settings";
import { GridData } from "../state/grid";
import { InterCityConnection } from "../state/inter_city_connection";
import { SpaceType } from "../state/location_type";
import { PlayerColor } from "../state/player";
import { Direction } from "../state/tile";
import { City, isCity } from "./city";
import { getOpposite } from "./direction";
import { isLand, Land, usesTownDisc } from "./location";
import { isTownTile } from "./tile";
import { Exit, TOWN, Track, tupleMap } from "./track";

export type Space = City | Land;

export class Grid {
  private citiesCache: City[] | undefined;
  private sameCitiesCache: Map<number, City[]> | undefined;
  readonly topLeft: DoubleHeight;
  readonly bottomRight: DoubleHeight;

  private constructor(
    private readonly mapSettings: MapSettings,
    private readonly grid: ImmutableMap<Coordinates, Space>,
    readonly connections: InterCityConnection[],
  ) {
    const doubleHeights = [...this.keys()].map((coord) =>
      coord.toDoubleHeight(this.mapSettings.rotation),
    );
    this.topLeft = DoubleHeight.from(
      Math.min(...doubleHeights.map(({ col }) => col)),
      Math.min(...doubleHeights.map(({ row }) => row)),
    );
    this.bottomRight = DoubleHeight.from(
      Math.max(...doubleHeights.map(({ col }) => col)),
      Math.max(...doubleHeights.map(({ row }) => row)),
    );
  }

  getConnection(id: string): InterCityConnection | undefined {
    return this.connections.find((connection) => connection.id === id);
  }

  get(coordinates: Coordinates): Space | undefined {
    return this.grid.get(coordinates);
  }

  has(coordinates: Coordinates): boolean {
    return this.grid.has(coordinates);
  }

  keys(): Iterable<Coordinates> {
    return this.grid.keys();
  }

  *doubleHeights(): Iterable<DoubleHeight> {
    for (const key of this.keys()) {
      yield this.toDoubleHeightDisplay(key);
    }
  }

  toDoubleHeightDisplay(coordinate: Coordinates): DoubleHeight {
    return coordinate.toDoubleHeight(
      this.mapSettings.rotation,
      this.topLeft,
      this.bottomRight,
    );
  }

  countTownDiscs(): number {
    return [...this.values()]
      .filter(isLand)
      .map((land) => land.getTileType())
      .filter(isNotNull)
      .filter(isTownTile)
      .filter(usesTownDisc).length;
  }

  countOwnershipMarkers(color: PlayerColor): number {
    const visited = new Set<Track>();
    let count = 0;
    for (const space of this.values()) {
      if (space instanceof City) continue;
      for (const startTrack of space.getTrack()) {
        if (startTrack.getOwner() !== color) continue;
        if (visited.has(startTrack)) continue;
        count++;
        for (const track of this.getRoute(startTrack)) {
          visited.add(track);
        }
      }
    }
    for (const connection of this.connections) {
      if (connection.owner?.color === color) count++;
    }
    return count;
  }

  displayName(coordinates: Coordinates): string {
    const space = this.get(coordinates);
    const coordinatesString =
      this.toDoubleHeightDisplay(coordinates).toString();
    const name = space?.name();
    const nameIsEmpty = name == null || name.length === 0;
    if (!nameIsEmpty) {
      return `${name} (${coordinatesString})`;
    }
    return coordinatesString;
  }

  values(): Iterable<Space> {
    return this.grid.values();
  }

  getSameCities(city: City): City[] {
    if (city.data.sameCity == null) return [city];
    if (this.sameCitiesCache == null) {
      this.sameCitiesCache = new Map<number, City[]>();
      for (const city of this.cities()) {
        const key = city.data.sameCity;
        if (key == null) continue;
        if (!this.sameCitiesCache.has(key)) {
          this.sameCitiesCache.set(key, []);
        }
        this.sameCitiesCache.get(key)!.push(city);
      }
    }
    return this.sameCitiesCache.get(city.data.sameCity)!;
  }

  cities(): City[] {
    if (this.citiesCache == null) {
      this.citiesCache = [...this.values()].filter(isCity);
    }
    return this.citiesCache;
  }

  getCityByName(name: string): City {
    const city = this.cities().find((c) => c.name() === name);
    assert(city != null, `City with name ${name} not found`);
    return city;
  }

  entries(): Iterable<[Coordinates, Space]> {
    return this.grid.entries();
  }

  getNeighbor(coordinates: Coordinates, dir: Direction): Space | undefined {
    if (this.mapSettings.getNeighbor) {
      const result = this.mapSettings.getNeighbor(this, coordinates, dir);
      if (result != null) return result;
    }
    return this.get(coordinates.neighbor(dir));
  }

  getDanglers(color: PlayerColor | undefined): Track[] {
    return this.getAllDanglers().filter((track) => track.getOwner() === color);
  }

  getAllDanglers(): Track[] {
    return [...this.values()]
      .filter(isLand)
      .flatMap((land) => land.getTrack())
      .filter((track) => this.dangles(track));
  }

  /** Returns whether this track dangles. Not whether some track on the same route dangles. */
  dangles(track: Track): boolean {
    return this.exitInfo(track).some((info) => info.dangles);
  }

  getImmovableExitReference(track: Track): Direction {
    return this.exitInfo(track).find(
      (info) => info.exit != TOWN && info.immovable,
    )!.exit as Direction;
  }

  /** Returns a list of exits that cannot be redirected. */
  private exitInfo(track: Track): [ExitInfo, ExitInfo] {
    const isClaimableRoute = track.isClaimable() || track.wasClaimed();
    return tupleMap(track.getExits(), (exit) => {
      const otherExit = track.otherExit(exit);
      const connects =
        exit === TOWN ||
        this.getNeighbor(track.coordinates, exit) instanceof City ||
        this.getTrackConnection(track.coordinates, exit) !== undefined;
      return {
        exit,
        dangles: !isClaimableRoute && !connects,
        immovable: isClaimableRoute || connects || otherExit === TOWN,
      };
    });
  }

  /**
   * Where neighbor is the location at fromCoordinates moved by direction, this
   * will return the Track, if it exists, at the neighbor coordinates that connects
   * back to fromCoordinates. If no track exists (e.g. because neighbor goes offboard,
   * the neighbor tile is a city, or there is simply no track on that tile) undefined
   * is returned.
   */
  getTrackConnection(
    fromCoordinates: Coordinates,
    direction: Direction,
  ): Track | undefined {
    const neighbor = this.getNeighbor(fromCoordinates, direction);
    if (neighbor == null) return undefined;

    if (neighbor instanceof City) {
      return undefined;
    }
    return neighbor.trackExiting(getOpposite(direction));
  }

  /** Returns every track on the path. */
  getRoute(track: Track): Track[] {
    const [routeOne, routeTwo] = tupleMap(track.getExits(), (exit) =>
      this.getRouteOneWay(track, exit),
    );
    return routeOne.reverse().concat([track, ...routeTwo]);
  }

  /** Returns the route going one direction, not including this. */
  private getRouteOneWay(track: Track, fromExit: Exit): Track[] {
    const toExit = track.getExits().find((e) => e !== fromExit)!;
    if (toExit === TOWN) {
      return [];
    }

    const neighbor = this.getTrackConnection(track.coordinates, toExit);
    if (neighbor === undefined) {
      return [];
    } else {
      return [neighbor, ...this.getRouteOneWay(neighbor, getOpposite(toExit))];
    }
  }

  /** Returns the coordinates of the last piece of track, and which direction it exits. */
  getEnd(track: Track, fromExit: Exit): [Coordinates, Exit] {
    const toExit = track.getExits().find((e) => e !== fromExit)!;
    if (toExit === TOWN) {
      return [track.coordinates, toExit];
    }

    const neighbor = this.getTrackConnection(track.coordinates, toExit);
    if (neighbor === undefined) {
      return [track.coordinates, toExit];
    } else {
      return this.getEnd(neighbor, getOpposite(toExit));
    }
  }

  /** Returns a new Grid, where every space is the same, but the one being updated. */
  setSpace(coordinates: Coordinates, space: Space) {
    return new Grid(
      this.mapSettings,
      this.grid.set(coordinates, space),
      this.connections,
    );
  }

  /** Returns a new Grid, where each space is updated if it changed. */
  merge(gridData: GridData, connections: InterCityConnection[]): Grid {
    let map = this.grid;
    const toDeleteKeys = new Set([...this.grid.keys()]);
    for (const [coordinates, spaceData] of gridData) {
      toDeleteKeys.delete(coordinates);
      if (
        map.has(coordinates) &&
        deepEquals(map.get(coordinates)!.data, spaceData)
      ) {
        continue;
      }
      if (spaceData.type === SpaceType.CITY) {
        map = map.set(coordinates, new City(coordinates, spaceData));
      } else {
        map = map.set(coordinates, new Land(coordinates, spaceData));
      }
    }

    if (toDeleteKeys.size > 0) {
      map = map.deleteAll(toDeleteKeys);
    }

    if (map === this.grid && deepEquals(connections, this.connections))
      return this;

    return new Grid(this.mapSettings, map, connections);
  }

  static fromData(
    mapSettings: MapSettings,
    gridData: GridData,
    connections: InterCityConnection[],
  ): Grid {
    return new Grid(mapSettings, ImmutableMap(), []).merge(
      gridData,
      connections,
    );
  }

  static fromSpaces(
    mapSettings: MapSettings,
    spaces: Space[],
    connections: InterCityConnection[],
  ): Grid {
    return new Grid(
      mapSettings,
      ImmutableMap(spaces.map((s) => [s.coordinates, s])),
      connections,
    );
  }
}

interface ExitInfo {
  exit: Exit;
  dangles: boolean;
  immovable: boolean;
}

export const DanglerInfo = z.object({
  // The exit leading to the city, or out of the town.
  immovableExit: z.nativeEnum(Direction),
  length: z.number(),
  coordinates: CoordinatesZod,
});

export type DanglerInfo = z.infer<typeof DanglerInfo>;
