import { Coordinates } from "../../utils/coordinates";
import { InvalidInputError } from "../../utils/error";
import { isNotNull, peek } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { inject } from "../framework/execution_context";
import { injectGrid } from "../game/state";
import { City } from "../map/city";
import { Land } from "../map/location";
import { TOWN, Track } from "../map/track";
import { goodToString } from "../state/good";
import { OwnedInterCityConnection } from "../state/inter_city_connection";
import { PlayerColor, playerColorToString, PlayerData } from "../state/player";
import { allDirections } from "../state/tile";
import { MoveHelper } from "./helper";
import { MoveData } from "./move";

export class MoveValidator {
  protected readonly grid = injectGrid();
  protected readonly moveHelper = inject(MoveHelper);

  validate(player: PlayerData, action: MoveData): void {
    this.validatePartial(player, action);
    this.validateEnd(action);
  }

  validateEnd(action: MoveData): void {
    if (action.path.length === 0) {
      throw new InvalidInputError("must move over at least one route");
    }

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

  validatePartial(player: PlayerData, action: MoveData): void {
    const grid = this.grid();
    if (!this.moveHelper.isWithinLocomotive(player, action)) {
      throw new InvalidInputError(
        `Your loco only allows ${this.moveHelper.getLocomotiveDisplay(player)} steps`,
      );
    }

    const startingCity = grid.get(action.startingCity);
    assert(startingCity != null);
    assert(
      startingCity.getGoods().includes(action.good),
      `${goodToString(action.good)} good not found at the indicated location`,
    );

    // Cannot visit the same stop twice
    const allCoordinates = [action.startingCity].concat(
      [...action.path.values()].map((v) => v.endingStop),
    );
    for (const [index, oneCoordinate] of allCoordinates.entries()) {
      const oneCity = this.grid().get(oneCoordinate);
      for (let i = index + 1; i < allCoordinates.length; i++) {
        const twoCity = this.grid().get(allCoordinates[i]);
        if (oneCity instanceof City && twoCity instanceof City) {
          assert(!oneCity.isSameCity(twoCity), {
            invalidInput: "Cannot visit the same city twice",
          });
        }
      }
    }
    assert(allCoordinates.length === new Set(allCoordinates).size, {
      invalidInput: "cannot stop at the same city twice",
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

    // Validate that the route is valid
    let fromCity: City | Land = startingCity;
    for (const step of action.path) {
      const routes = [
        ...this.findRoutesToLocation(
          player,
          fromCity.coordinates,
          step.endingStop,
        ),
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
    _: PlayerData,
    fromCoordinates: Coordinates,
    toCoordinates: Coordinates,
  ): RouteInfo[] {
    const space = this.grid().get(fromCoordinates);
    const toSpace = this.grid().get(toCoordinates);
    assert(space != null, "cannot call findRoutes from null location");
    return this.findRoutesFromLocation(fromCoordinates).filter((route) => {
      if (toSpace instanceof City) {
        return toSpace.isSameCity(this.grid().get(route.destination));
      } else {
        return toCoordinates === route.destination;
      }
    });
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
    const grid = this.grid();
    const allCities = grid.getSameCities(originCity);
    const trackRoutes: RouteInfo[] = allCities.flatMap((originCity) =>
      allDirections
        .map((direction) =>
          grid.getTrackConnection(originCity.coordinates, direction),
        )
        .filter(isNotNull)
        .filter((connection) => this.canMoveGoodsAcrossTrack(connection))
        .flatMap((connection) => {
          return this.findRoutesFromTrack(connection).filter(
            (route) => route.destination !== originCity.coordinates,
          );
        }),
    );
    const interCityRoutes: RouteInfo[] = grid.connections
      .filter((connection) =>
        connection.connects.some((c) => c.equals(originCity.coordinates)),
      )
      .filter((connection) => connection.owner != null)
      .flatMap((connection) => {
        const otherEnd = grid.get(
          connection.connects.find((c) => !originCity.coordinates.equals(c))!,
        );
        if (otherEnd instanceof City) {
          return [
            {
              type: "connection",
              destination: otherEnd.coordinates,
              connection: connection as OwnedInterCityConnection,
              owner: connection.owner!.color,
            },
          ];
        } else {
          return [];
        }
      });
    const additionalRoutes = this.getAdditionalRoutesFromCity(originCity);
    return trackRoutes.concat(interCityRoutes).concat(additionalRoutes);
  }

  private findRoutesFromLand(location: Land): RouteInfo[] {
    const standardRoutes = location
      .getTrack()
      .filter((track) => this.canMoveGoodsAcrossTrack(track))
      .flatMap((track) => this.findRoutesFromTrack(track))
      .filter((route) => route.destination !== location.coordinates);
    const additionalRoutes = this.getAdditionalRoutesFromLand(location);
    return standardRoutes.concat(additionalRoutes);
  }

  protected getAdditionalRoutesFromLand(_: Land): RouteInfo[] {
    return [];
  }

  protected getAdditionalRoutesFromCity(_: City): RouteInfo[] {
    return [];
  }

  private findRoutesFromTrack(startingTrack: Track): RouteInfo[] {
    return startingTrack
      .getExits()
      .map((exit): RouteInfo | undefined => {
        const [end, endExit] = this.grid().getEnd(startingTrack, exit);
        if (endExit === TOWN) {
          return {
            type: "track",
            destination: end,
            startingTrack,
            owner: startingTrack.getOwner(),
          };
        }
        const next = this.grid().get(end.neighbor(endExit));
        if (next instanceof City) {
          return {
            type: "track",
            destination: next.coordinates,
            startingTrack,
            owner: startingTrack.getOwner(),
          };
        }
        return undefined;
      })
      .filter(isNotNull);
  }

  private canMoveGoodsAcrossTrack(track: Track): boolean {
    return this.grid()
      .getRoute(track)
      .every((track) => !track.isClaimable());
  }
}

interface TrackRouteInfo {
  type: "track";
  destination: Coordinates;
  startingTrack: Track;
  owner: PlayerColor | undefined;
}

interface ConnectedCityRouteInfo {
  type: "connection";
  destination: Coordinates;
  connection: OwnedInterCityConnection;
  owner: PlayerColor | undefined;
}

export interface Teleport {
  type: "teleport";
  destination: Coordinates;
  owner: undefined;
}

export type RouteInfo = TrackRouteInfo | ConnectedCityRouteInfo | Teleport;
