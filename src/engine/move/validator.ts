import { Coordinates } from "../../utils/coordinates";
import { InvalidInputError } from "../../utils/error";
import { isNotNull, logError, peek } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { inject } from "../framework/execution_context";
import { injectCurrentPlayer, injectGrid } from "../game/state";
import { City } from "../map/city";
import { Land } from "../map/location";
import { TOWN, Track } from "../map/track";
import { goodToString } from "../state/good";
import { OwnedInterCityConnection } from "../state/inter_city_connection";
import { PlayerColor, playerColorToString } from "../state/player";
import { allDirections, Direction } from "../state/tile";
import { MoveHelper } from "./helper";
import { MoveData } from "./move";

export class MoveValidator {
  private readonly grid = injectGrid();
  private readonly moveHelper = inject(MoveHelper);
  private readonly currentPlayer = injectCurrentPlayer();

  validate(action: MoveData): void {
    let legacyErrorMessage: string | undefined;
    try {
      this.validateLegacy(action);
    } catch (e) {
      if (e instanceof InvalidInputError) {
        legacyErrorMessage = e.message;
      }
      throw e;
    }
    let newErrorMessage: string | undefined;
    try {
      this.validateNew(action);
    } catch (e) {
      if (e instanceof InvalidInputError) {
        newErrorMessage = e.message;
      }
      throw e;
    }
    if (legacyErrorMessage !== newErrorMessage) {
      logError(
        '"Legacy" and "New" validation errors do not match',
        {},
        legacyErrorMessage,
        newErrorMessage,
      );
    }
    if (legacyErrorMessage != null) {
      throw new InvalidInputError(legacyErrorMessage);
    }
  }

  validateNew(action: MoveData): void {
    this.validatePartial(action);

    const endingLocation = this.grid().get(peek(action.path).endingStop);

    if (!(endingLocation instanceof City)) {
      throw new InvalidInputError(
        `${goodToString(action.good)} good cannot be delivered to non city`,
      );
    }
    assert(this.moveHelper.canDeliverTo(endingLocation, action.good), {
      invalidInput: `${goodToString(action.good)} good cannot be delivered to ${endingLocation.goodColors().map(goodToString).join("/")} city`,
    });
  }

  validatePartial(action: MoveData): void {
    const grid = this.grid();
    const curr = this.currentPlayer();
    if (!this.moveHelper.isWithinLocomotive(curr, action)) {
      throw new InvalidInputError(
        `Can only move ${this.moveHelper.getLocomotiveDisplay(curr)} steps`,
      );
    }
    if (action.path.length === 0) {
      throw new InvalidInputError("must move over at least one route");
    }

    const startingCity = grid.get(action.startingCity);
    assert(startingCity != null);
    assert(
      startingCity.getGoods().includes(action.good),
      `${goodToString(action.good)} good not found at the indicated location`,
    );

    // Validate that the route passes through cities and towns
    for (const step of action.path.slice(0, action.path.length - 1)) {
      const location = grid.get(step.endingStop);
      if (
        !(location instanceof City) &&
        !(location instanceof Land && location.hasTown())
      ) {
        throw new InvalidInputError(
          "Invalid path, must pass through cities and towns",
        );
      }
      if (
        location instanceof City &&
        !this.moveHelper.canMoveThrough(location, action.good)
      ) {
        throw new InvalidInputError(
          `Cannot pass through a ${location.goodColors().map(goodToString).join("/")} city with a ${goodToString(action.good)} good`,
        );
      }
    }

    // Cannot visit the same stop twice
    const allCoordinates = [action.startingCity]
      .concat([...action.path.values()].map((v) => v.endingStop))
      .map(Coordinates.from);
    for (const [index, coordinate] of allCoordinates.entries()) {
      for (const otherCoordinate of allCoordinates.slice(index + 1)) {
        assert(
          !coordinate.equals(otherCoordinate),
          "cannot stop at the same city twice",
        );
      }
    }

    // Validate that the route is valid
    let fromCity: City | Land = startingCity;
    for (const step of action.path) {
      const routes = [
        ...this.findRoutesToLocation(fromCity.coordinates, step.endingStop),
      ];

      assert(routes.length > 0, {
        invalidInput: `no routes found between ${this.grid().displayName(fromCity.coordinates)} and ${this.grid().displayName(step.endingStop)}`,
      });

      assert(
        routes.some((r) => r.owner === step.owner),
        {
          invalidInput: `no routes found between ${this.grid().displayName(fromCity.coordinates)} and ${this.grid().displayName(step.endingStop)} owned by ${playerColorToString(step.owner)}`,
        },
      );

      fromCity = grid.get(step.endingStop)!;
    }
  }

  findRoutesToLocation(
    fromCoordinates: Coordinates,
    toCoordinates: Coordinates,
  ): RouteInfo[] {
    return this.findRoutesToLocationLegacy(fromCoordinates, toCoordinates).map((connection) => {
      if (connection instanceof Track) {
        return {
          type: "track",
          destination: {
            type: "city",
            coordinates: connection.coordinates,
          } as Destination,
          startingTrack: connection,
          fullRoute: this.grid().getRoute(connection),
          owner: connection.getOwner(),
        };
      } else {
        return {
          type: "connection",
          destination: {
            type: "city",
            coordinates: toCoordinates,
            city: this.grid().get(toCoordinates) as City,
          },
          connection,
          owner: connection.owner.color,
        };
      }
    });
  }


  findRoutesToLocationNew(
    fromCoordinates: Coordinates,
    toCoordinates: Coordinates,
  ): RouteInfo[] {
    const space = this.grid().get(fromCoordinates);
    assert(space != null, "cannot call findRoutes from null location");
    return this.findRoutesFromLocation(fromCoordinates).filter((route) =>
      route.destination.coordinates.equals(toCoordinates),
    );
  }

  findRoutesFromLocation(fromCoordinates: Coordinates): RouteInfo[] {
    const space = this.grid().get(fromCoordinates);
    assert(space != null, "cannot call findRoutes from null location");
    if (space instanceof City) {
      return this.findRoutesFromCity(space);
    }
    return this.findRoutesFromLand(space);
  }

  private findRoutesFromCity(originCity: City): RouteInfo[] {
    const allCities = this.grid()
      .cities()
      .filter((otherCity) => originCity.isSameCity(otherCity));
    return allCities
      .flatMap((city) =>
        allDirections.map((direction) =>
          this.grid().connection(city.coordinates, direction),
        ),
      )
      .filter(isNotNull)
      .filter(
        (connection): connection is Track | OwnedInterCityConnection =>
          !(connection instanceof City),
      )
      .filter((connection) => {
        if (connection instanceof Track) {
          return this.canMoveGoodsAcrossTrack(connection);
        }
        return true;
      })
      .flatMap((connection) => {
        if (connection instanceof Track) {
          return this.findRoutesFromTrack(connection).filter(
            (route) =>
              route.destination.type !== "city" ||
              route.destination.city !== originCity,
          );
        }
        const otherCity = this.grid().get(
          connection.connects.find((c) => originCity.coordinates !== c)!,
        ) as City;
        return [
          {
            type: "connection",
            destination: {
              type: "city",
              coordinates: otherCity.coordinates,
              city: otherCity,
            },
            connection,
            owner: connection.owner.color,
          },
        ];
      });
  }

  private findRoutesFromLand(location: Land): RouteInfo[] {
    return location
      .getTrack()
      .filter((track) => this.canMoveGoodsAcrossTrack(track))
      .flatMap((track) => this.findRoutesFromTrack(track))
      .filter(
        (route) =>
          route.destination.type !== "town" ||
          route.destination.land === location,
      );
  }

  private findRoutesFromTrack(startingTrack: Track): RouteInfo[] {
    return startingTrack.getExits().map((exit): RouteInfo => {
      const [end, endExit] = this.grid().getEnd(startingTrack, exit);
      const fullRoute = this.grid().getRoute(startingTrack);
      if (endExit === TOWN) {
        return {
          type: "track",
          destination: {
            type: "town",
            land: this.grid().get(end) as Land,
            coordinates: end,
          },
          startingTrack,
          fullRoute,
          owner: startingTrack.getOwner(),
        };
      }
      const next = this.grid().get(end.neighbor(endExit));
      if (next instanceof City) {
        return {
          type: "track",
          destination: {
            type: "city",
            city: next,
            coordinates: next.coordinates,
          },
          startingTrack,
          fullRoute,
          owner: startingTrack.getOwner(),
        };
      }
      return {
        type: "track",
        destination: {
          type: "dangles",
          coordinates: end,
          exit: endExit,
        },
        startingTrack,
        fullRoute,
        owner: startingTrack.getOwner(),
      };
    });
  }

  private canMoveGoodsAcrossTrack(track: Track): boolean {
    return this.grid()
      .getRoute(track)
      .every((track) => !track.isClaimable());
  }

  findRoutesToLocationLegacy(
    fromCoordinates: Coordinates,
    toCoordinates: Coordinates,
  ): Array<Track | OwnedInterCityConnection> {
    const space = this.grid().get(fromCoordinates);
    assert(space != null, "cannot call findRoutes from null location");
    if (space instanceof City) {
      return this.findRoutesToLocationFromCity(space, toCoordinates);
    }
    return this.findRoutesToLocationFromLocation(space, toCoordinates);
  }

  private findRoutesToLocationFromLocation(
    location: Land,
    coordinates: Coordinates,
  ): Track[] {
    return location
      .getTrack()
      .filter((track) => this.endsWith(track, coordinates))
      .filter((track) => this.canMoveGoodsAcrossTrack(track));
  }

  private findRoutesToLocationFromCity(
    originCity: City,
    coordinates: Coordinates,
  ): Array<Track | OwnedInterCityConnection> {
    const allCities = this.grid()
      .cities()
      .filter((otherCity) => originCity.isSameCity(otherCity));
    return allCities
      .flatMap((city) =>
        allDirections.map((direction) =>
          this.grid().connection(city.coordinates, direction),
        ),
      )
      .filter(isNotNull)
      .filter(
        (connection): connection is Track | OwnedInterCityConnection =>
          !(connection instanceof City),
      )
      .filter((connection) => {
        if (connection instanceof Track) {
          return (
            this.endsWith(connection, coordinates) &&
            this.canMoveGoodsAcrossTrack(connection)
          );
        } else {
          return connection.connects.includes(coordinates);
        }
      });
  }

  /** Returns whether the given coordinates are at the end of the given track */
  private endsWith(track: Track, coordinates: Coordinates): boolean {
    const route = this.grid().getRoute(track);
    const end = this.grid().get(coordinates);
    if (end == null) return false;
    if (end instanceof City) {
      return exitsToCity(route[0]) || exitsToCity(peek(route));

      function exitsToCity(track: Track): boolean {
        return track
          .getExits()
          .some(
            (e) =>
              e !== TOWN && track.coordinates.neighbor(e).equals(coordinates),
          );
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

  validateLegacy(action: MoveData): void {
    const grid = this.grid();
    const curr = this.currentPlayer();
    if (!this.moveHelper.isWithinLocomotive(curr, action)) {
      throw new InvalidInputError(
        `Can only move ${this.moveHelper.getLocomotiveDisplay(curr)} steps`,
      );
    }
    if (action.path.length === 0) {
      throw new InvalidInputError("must move over at least one route");
    }

    const startingCity = grid.get(action.startingCity);
    assert(startingCity != null);
    assert(
      startingCity.getGoods().includes(action.good),
      `${goodToString(action.good)} good not found at the indicated location`,
    );

    const endingLocation = grid.get(peek(action.path).endingStop);

    if (!(endingLocation instanceof City)) {
      throw new InvalidInputError(
        `${goodToString(action.good)} good cannot be delivered to non city`,
      );
    }
    assert(this.moveHelper.canDeliverTo(endingLocation, action.good), {
      invalidInput: `${goodToString(action.good)} good cannot be delivered to ${endingLocation.goodColors().map(goodToString).join("/")} city`,
    });

    // Validate that the route passes through cities and towns
    for (const step of action.path.slice(0, action.path.length - 1)) {
      const location = grid.get(step.endingStop);
      if (
        !(location instanceof City) &&
        !(location instanceof Land && location.hasTown())
      ) {
        throw new InvalidInputError(
          "Invalid path, must pass through cities and towns",
        );
      }
      if (
        location instanceof City &&
        !this.moveHelper.canMoveThrough(location, action.good)
      ) {
        throw new InvalidInputError(
          `Cannot pass through a ${location.goodColors().map(goodToString).join("/")} city with a ${goodToString(action.good)} good`,
        );
      }
    }

    // Cannot visit the same stop twice
    const allCoordinates = [action.startingCity]
      .concat([...action.path.values()].map((v) => v.endingStop))
      .map(Coordinates.from);
    for (const [index, coordinate] of allCoordinates.entries()) {
      for (const otherCoordinate of allCoordinates.slice(index + 1)) {
        assert(
          !coordinate.equals(otherCoordinate),
          "cannot stop at the same city twice",
        );
      }
    }

    // Validate that the route is valid
    let fromCity: City | Land = startingCity;
    for (const step of action.path) {
      const routes = [
        ...this.findRoutesToLocationLegacy(
          fromCity.coordinates,
          step.endingStop,
        ),
      ];

      assert(routes.length > 0, {
        invalidInput: `no routes found between ${this.grid().displayName(fromCity.coordinates)} and ${this.grid().displayName(step.endingStop)}`,
      });

      assert(
        routes.some((v) =>
          v instanceof Track
            ? v.getOwner() === step.owner
            : v.owner.color === step.owner,
        ),
        {
          invalidInput: `no routes found between ${this.grid().displayName(fromCity.coordinates)} and ${this.grid().displayName(step.endingStop)} owned by ${playerColorToString(step.owner)}`,
        },
      );

      fromCity = grid.get(step.endingStop)!;
    }
  }
}

interface TownDestination {
  type: "town";
  coordinates: Coordinates;
  land: Land;
}

interface CityDestination {
  type: "city";
  coordinates: Coordinates;
  city: City;
}

interface DanglingDestination {
  type: "dangles";
  coordinates: Coordinates;
  exit: Direction;
}

type Destination = TownDestination | CityDestination | DanglingDestination;

interface TrackRouteInfo {
  type: "track";
  destination: Destination;
  startingTrack: Track;
  fullRoute: Track[];
  owner: PlayerColor | undefined;
}

interface ConnectedCityRouteInfo {
  type: "connection";
  destination: Destination;
  connection: OwnedInterCityConnection;
  owner: PlayerColor | undefined;
}

type RouteInfo = TrackRouteInfo | ConnectedCityRouteInfo;
