import z from "zod";
import { BuildAction, BuildData } from "../../engine/build/build";
import {
  ConnectCitiesAction,
  ConnectCitiesData,
} from "../../engine/build/connect_cities";
import { BuildPhase } from "../../engine/build/phase";
import { Validator, InvalidBuildReason } from "../../engine/build/validator";
import { BOTTOM, Direction } from "../../engine/state/tile";
import { MoveValidator, RouteInfo } from "../../engine/move/validator";
import { PlayerColor } from "../../engine/state/player";
import { DanglerInfo } from "../../engine/map/grid";
import { OwnedInterCityConnection } from "../../engine/state/inter_city_connection";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { City } from "../../engine/map/city";
import { calculateTrackInfo, Land } from "../../engine/map/location";
import { Exit, TOWN } from "../../engine/map/track";
import { Coordinates } from "../../utils/coordinates";
import { assert } from "../../utils/validate";

const CONNECTED_TO_LISBOA = new Key("connectedToLisboa", {
  parse: z.boolean().parse,
});

export class LisboaBuildAction extends BuildAction {
  private readonly connected = injectState(CONNECTED_TO_LISBOA);

  validate(data: BuildData): void {
    super.validate(data);
    // Only one connection out of Lisboa can be built per turn, per player.
    assert(!this.isNewConnectionToLisboa(data) || !this.connected(), {
      invalidInput: "can only link to lisboa once per turn",
    });
  }

  process(data: BuildData): boolean {
    this.connected.set(this.connected() || this.isNewConnectionToLisboa(data));
    return super.process(data);
  }

  private isNewConnectionToLisboa(data: BuildData): boolean {
    // First, check if there already is a connection out of Lisboa.
    const alreadyExists = (this.grid().get(data.coordinates) as Land)
      .getTrack()
      .some((track) =>
        track
          .getExits()
          .some((e) => this.connectsToLisboa(data.coordinates, e)),
      );
    if (alreadyExists) return false;

    const trackInfo = calculateTrackInfo(data);
    return trackInfo.some((track) =>
      track.exits.some((e) => this.connectsToLisboa(data.coordinates, e)),
    );
  }

  private connectsToLisboa(coordinates: Coordinates, exit: Exit) {
    if (exit === TOWN) return false;
    const neighbor = this.grid().get(coordinates.neighbor(exit));
    return isLisboa(neighbor);
  }
}

export class LisboaConnectAction extends ConnectCitiesAction {
  private readonly connected = injectState(CONNECTED_TO_LISBOA);

  protected validateUrbanizedCities(): void {}

  validate(data: ConnectCitiesData): void {
    super.validate(data);
    // Only one connection out of Lisboa can be built per turn, per player.
    assert(!this.isConnectedToLisboa(data) || !this.connected(), {
      invalidInput: "can only link to lisboa once per turn",
    });
  }

  process(data: ConnectCitiesData): boolean {
    this.connected.set(this.connected() || this.isConnectedToLisboa(data));
    return super.process(data);
  }

  private isConnectedToLisboa(data: ConnectCitiesData): boolean {
    const connection = this.getConnection(data);
    return connection.connects
      .map((coordinates) => this.grid().get(coordinates))
      .some(isLisboa);
  }
}

export class PortugalValidator extends Validator {
  protected connectionAllowed(
    land: Land,
    exit: Direction,
  ): InvalidBuildReason | undefined {
    if (
      (land.name() === "Sagres" || land.name() === "Sines") &&
      land.hasTown() &&
      exit === BOTTOM
    ) {
      return undefined;
    }

    return super.connectionAllowed(land, exit);
  }
}

export class PortugalMoveValidator extends MoveValidator {
  protected getAdditionalRoutesFromLand(location: Land): RouteInfo[] {
    const grid = this.grid();
    return grid.connections
      .filter((connection) =>
        connection.connects.some((c) => c.equals(location.coordinates)),
      )
      .filter((connection) => connection.owner != null)
      .flatMap((connection) => {
        const otherEnd = grid.get(
          connection.connects.find((c) => !location.coordinates.equals(c))!,
        );
        if (!(otherEnd instanceof City)) {
          return [];
        }
        if (
          (isLisboa(otherEnd) || otherEnd.name() === "Madeira") &&
          (location.name() === "Sagres" || location.name() === "Sines") &&
          location.hasTown()
        ) {
          return [
            {
              type: "connection",
              destination: otherEnd.coordinates,
              connection: connection as OwnedInterCityConnection,
              owner: connection.owner!.color,
            },
          ];
        }
        return [];
      });
  }

  protected getAdditionalRoutesFromCity(location: City): RouteInfo[] {
    const grid = this.grid();
    return grid.connections
      .filter((connection) =>
        connection.connects.some((c) => c.equals(location.coordinates)),
      )
      .filter((connection) => connection.owner != null)
      .flatMap((connection) => {
        const otherEnd = grid.get(
          connection.connects.find((c) => !location.coordinates.equals(c))!,
        );
        if (!(otherEnd instanceof Land)) {
          return [];
        }
        if (
          (isLisboa(location) || location.name() === "Madeira") &&
          (otherEnd.name() === "Sagres" || otherEnd.name() === "Sines") &&
          otherEnd.hasTown()
        ) {
          return [
            {
              type: "connection",
              destination: otherEnd.coordinates,
              connection: connection as OwnedInterCityConnection,
              owner: connection.owner!.color,
            },
          ];
        }
        return [];
      });
  }
}

export class PortugalBuildPhase extends BuildPhase {
  private readonly connected = injectState(CONNECTED_TO_LISBOA);
  onStartTurn(): void {
    super.onStartTurn();
    this.connected.initState(false);
  }

  onEndTurn(): void {
    this.connected.delete();
    super.onEndTurn();
  }

  getDanglersAsInfo(color?: PlayerColor): DanglerInfo[] {
    return this.grid()
      .getDanglers(color)
      .filter((track) => {
        if (
          //Sines
          ((track.coordinates.q === 14 && track.coordinates.r === 7) ||
            //Sagres
            (track.coordinates.q === 17 && track.coordinates.r === 6)) &&
          this.grid().getImmovableExitReference(track) === BOTTOM
        ) {
          return false;
        }

        return true;
      })
      .map((track) => ({
        coordinates: track.coordinates,
        immovableExit: this.grid().getImmovableExitReference(track),
        length: this.grid().getRoute(track).length,
      }));
  }
}

function isLisboa(space: City | Land | undefined): boolean {
  return space instanceof City && space.name() === "Lisboa";
}
