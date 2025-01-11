import { Map as ImmutableMap } from 'immutable';
import { z } from "zod";
import { Coordinates, CoordinatesZod } from "../../utils/coordinates";
import { deepEquals } from '../../utils/deep_equals';
import { DoubleHeight } from '../../utils/double_height';
import { isNotNull, peek } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { GridData } from "../state/grid";
import { InterCityConnection } from '../state/inter_city_connection';
import { SpaceType } from "../state/location_type";
import { PlayerColor } from "../state/player";
import { allDirections, Direction } from "../state/tile";
import { City, isCity } from "./city";
import { getOpposite } from "./direction";
import { isLand, Land, usesTownDisc } from "./location";
import { isTownTile } from './tile';
import { Exit, TOWN, Track, tupleMap } from "./track";

export type Space = City | Land;

export class Grid {
  readonly topLeft: DoubleHeight;
  readonly bottomRight: DoubleHeight;

  private constructor(private readonly grid: ImmutableMap<Coordinates, Space>, readonly connections: InterCityConnection[]) {
    const doubleHeights = [...this.keys()].map(coord => coord.toDoubleHeight());
    this.topLeft = new DoubleHeight(
      Math.min(...doubleHeights.map(({ col }) => col)),
      Math.min(...doubleHeights.map(({ row }) => row)),
    );
    this.bottomRight = new DoubleHeight(
      Math.max(...doubleHeights.map(({ col }) => col)),
      Math.max(...doubleHeights.map(({ row }) => row)),
    );
  }

  findConnection(connection: Coordinates[]): InterCityConnection | undefined {
    const set = new Set(connection);
    return this.connections.find(({ connects }) => connects.every((c) => set.has(c)));
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
    return coordinate.toDoubleHeight()
      .offset(-this.topLeft.col, -this.topLeft.row);
  }

  countTownDiscs(): number {
    return [...this.values()]
      .filter(isLand)
      .map((land) => land.getTileType())
      .filter(isNotNull)
      .filter(isTownTile)
      .filter(usesTownDisc)
      .length;
  }

  countOwnershipMarkers(color: PlayerColor): number {
    const visited = new Set<Track>();
    let count = 0;
    for (let space of this.values()) {
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
    return count;
  }

  displayName(coordinates: Coordinates): string {
    const space = this.get(coordinates);
    const coordinatesString = this.toDoubleHeightDisplay(coordinates).toString();
    if (space?.name() != null) {
      return `${space.name()} (${coordinatesString})`;
    }
    return coordinatesString;
  }

  values(): Iterable<Space> {
    return this.grid.values();
  }

  cities(): City[] {
    return [...this.values()].filter(isCity);
  }

  entries(): Iterable<[Coordinates, Space]> {
    return this.grid.entries();
  }

  getNeighbor(coordinates: Coordinates, dir: Direction): Space | undefined {
    return this.get(coordinates.neighbor(dir));
  }

  getDanglers(color?: PlayerColor): Track[] {
    return [...this.values()].filter(isLand).flatMap((land) => land.getTrack())
      .filter((track) => track.getOwner() === color)
      .filter((track) => this.dangles(track));
  }

  /** Returns whether this track dangles. Not whether some track on the same route dangles. */
  dangles(track: Track): boolean {
    return this.exitInfo(track).some((info) => info.dangles);
  }

  getImmovableExitReference(track: Track): Direction {
    return this.exitInfo(track).find((info) => info.exit != TOWN && info.immovable)!.exit as Direction;
  }

  /** Returns a list of exits that cannot be redirected. */
  private exitInfo(track: Track): [ExitInfo, ExitInfo] {
    return tupleMap(track.getExits(), (exit) => {
      const otherExit = track.otherExit(exit);
      const connects = exit === TOWN || this.connection(track.coordinates, exit) != null;
      return {
        exit,
        dangles: !connects,
        immovable: connects || otherExit === TOWN,
      };
    });
  }

  connection(fromCoordinates: Coordinates, direction: Direction): City | Track | undefined {
    const neighbor = this.grid.get(fromCoordinates.neighbor(direction));
    if (neighbor == null) return undefined;

    if (neighbor instanceof City) {
      return neighbor;
    }
    return neighbor.trackExiting(getOpposite(direction));
  }

  /** Returns every track on the path. */
  getRoute(track: Track): Track[] {
    const [routeOne, routeTwo] = tupleMap(track.getExits(), exit => this.getRouteOneWay(track, exit));
    return routeOne.reverse().concat([track, ...routeTwo]);
  }

  /** Returns the route going one direction, not including this. */
  private getRouteOneWay(track: Track, fromExit: Exit): Track[] {
    const toExit = track.getExits().find(e => e !== fromExit)!;
    if (toExit === TOWN) {
      return [];
    }

    const neighbor = this.connection(track.coordinates, toExit);
    if (neighbor == undefined || neighbor instanceof City) {
      return [];
    } else {
      return [neighbor, ...this.getRouteOneWay(neighbor, getOpposite(toExit))];
    }
  }

  /** Returns the coordinates of the last piece of track, and which direction it exits. */
  getEnd(track: Track, fromExit: Exit): [Coordinates, Exit] {
    const toExit = track.getExits().find(e => e !== fromExit)!;
    if (toExit === TOWN) {
      return [track.coordinates, toExit];
    }

    const neighbor = this.connection(track.coordinates, toExit);
    if (neighbor == undefined || neighbor instanceof City) {
      return [track.coordinates, toExit];
    } else {
      return this.getEnd(neighbor, getOpposite(toExit));
    }
  }

  /** Returns whether the given coordinates are at the end of the given track */
  endsWith(track: Track, coordinates: Coordinates): boolean {
    const route = this.getRoute(track);
    const end = this.get(coordinates);
    if (end == null) return false;
    if (end instanceof City) {
      return exitsToCity(route[0]) || exitsToCity(peek(route));

      function exitsToCity(track: Track): boolean {
        return track.getExits().some(e => e !== TOWN && track.coordinates.neighbor(e).equals(coordinates));
      }
    } else if (end.hasTown()) {
      return exitsToTown(route[0]) || exitsToTown(peek(route));

      function exitsToTown(track: Track) {
        return track.coordinates.equals(coordinates);
      }
    } else {
      return false;
    }
  }

  findRoutesToLocation(fromCoordinates: Coordinates, toCoordinates: Coordinates): Track[] {
    const space = this.grid.get(fromCoordinates);
    assert(space != null, 'cannot call findRoutes from null location');
    if (space instanceof City) {
      return this.findRoutesToLocationFromCity(space, toCoordinates);
    }
    return this.findRoutesToLocationFromTown(space, toCoordinates);
  }

  findRoutesToLocationFromTown(location: Land, coordinates: Coordinates): Track[] {
    assert(location.hasTown(), 'cannot call findRoutesToLocation from a non-town hex');
    return location.getTrack().filter((track) => this.endsWith(track, coordinates))
      .filter((track) => this.canMoveGoodsAcrossTrack(track));
  }

  findRoutesToLocationFromCity(city: City, coordinates: Coordinates): Track[] {
    return allDirections.map((direction) => {
      const neighbor = this.get(city.coordinates.neighbor(direction));
      if (neighbor == null || neighbor instanceof City) {
        return undefined;
      }
      return neighbor.trackExiting(getOpposite(direction));
    })
      .filter(isNotNull)
      .filter((track) => this.endsWith(track, coordinates))
      .filter((track) => this.canMoveGoodsAcrossTrack(track));
  }

  canMoveGoodsAcrossTrack(track: Track): boolean {
    return this.getRoute(track).every((track) => !track.isClaimable());
  }

  merge(gridData: GridData, connections: InterCityConnection[]): Grid {
    let map = this.grid;
    const toDeleteKeys = new Set([...this.grid.keys()]);
    for (const [coordinates, spaceData] of gridData) {
      toDeleteKeys.delete(coordinates);
      if (map.has(coordinates) && deepEquals(map.get(coordinates)!.data, spaceData)) {
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

    if (map === this.grid) return this;

    return new Grid(map, connections);
  }

  static fromData(gridData: GridData, connections: InterCityConnection[]): Grid {
    return new Grid(ImmutableMap(), []).merge(gridData, connections);
  }

  static fromSpaces(spaces: Space[], connections: InterCityConnection[]): Grid {
    return new Grid(ImmutableMap(spaces.map(s => [s.coordinates, s])), connections);
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