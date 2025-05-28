import { Coordinates } from "../../utils/coordinates";
import { deepEquals } from "../../utils/deep_equals";
import { assert } from "../../utils/validate";
import { injectState } from "../framework/execution_context";
import { GRID, injectGrid, INTER_CITY_CONNECTIONS } from "../game/state";
import {
  InterCityConnection,
  interCityConnectionEquals,
} from "../state/inter_city_connection";
import { SpaceType } from "../state/location_type";
import { PlayerColor } from "../state/player";
import { MutableSpaceData, SpaceData } from "../state/space";
import { City } from "./city";
import { Space } from "./grid";
import { calculateTile, calculateTrackInfo } from "./location";
import { Track } from "./track";

export class GridHelper {
  private readonly grid = injectState(GRID);
  private readonly interCityConnections = injectState(INTER_CITY_CONNECTIONS);
  private readonly spaces = injectGrid();

  set(coordinates: Coordinates, space: SpaceData): void {
    this.grid.update((grid) => {
      grid.set(coordinates, space);
      return grid;
    });
  }

  update(
    coordinates: Coordinates,
    updateFn: (value: MutableSpaceData) => void,
  ): void {
    this.grid.update((grid) => updateFn(grid.get(coordinates)!));
  }

  setRouteOwner(track: Track, owner?: PlayerColor): void {
    for (const trackInRoute of this.spaces().getRoute(track)) {
      this.update(trackInRoute.coordinates, (hex) => {
        assert(hex.type !== SpaceType.CITY);
        hex.tile!.owners[trackInRoute.ownerIndex] = owner;
      });
    }
  }

  removeTrack(track: Track) {
    this.update(track.coordinates, (hex) => {
      assert(hex.type !== SpaceType.CITY);
      const oldTrackInfo = calculateTrackInfo(hex.tile!);
      const newTrackInfo = oldTrackInfo.filter(
        (trackInfo) =>
          !deepEquals(trackInfo.exits, track.getExits()) &&
          !deepEquals(trackInfo.exits.reverse(), track.getExits()),
      );
      hex.tile = calculateTile(newTrackInfo);
    });
  }

  setInterCityOwner(
    owner: PlayerColor | undefined,
    connection: InterCityConnection,
  ): void {
    this.interCityConnections.update((connections) => {
      const matching = connections.find((c) =>
        interCityConnectionEquals(connection, c),
      )!;
      matching.owner = { color: owner };
    });
  }

  lookup(coordinates: Coordinates): Space | undefined {
    return this.spaces().get(coordinates);
  }

  all(): Iterable<Space> {
    return this.spaces().values();
  }

  displayName(coordinates: Coordinates): string {
    return this.spaces().displayName(coordinates);
  }

  *findAllCities(): Iterable<City> {
    for (const space of this.all()) {
      if (space instanceof City) yield space;
    }
  }
}
