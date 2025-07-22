import { Key } from "../../engine/framework/key";
import z from "zod";
import { BuildPhase } from "../../engine/build/phase";
import { inject, injectState } from "../../engine/framework/execution_context";
import { assert } from "../../utils/validate";
import {
  ConnectCitiesAction,
  ConnectCitiesData,
} from "../../engine/build/connect_cities";
import { arrayEqualsIgnoreOrder } from "../../utils/functions";
import { InterCityConnection } from "../../engine/state/inter_city_connection";
import { InvalidBuildReason, Validator } from "../../engine/build/validator";
import { DenmarkMapData } from "./map_data";
import { BuildAction, BuildData } from "../../engine/build/build";
import { Land } from "../../engine/map/location";
import { Direction } from "../../engine/state/tile";
import { TrackInfo } from "../../engine/map/track";
import { City } from "../../engine/map/city";
import { PlayerColor } from "../../engine/state/player";
import { MoveValidator, RouteInfo } from "../../engine/move/validator";

const FERRY_CLAIM_COUNT = new Key("FERRY_CLAIM_COUNT", {
  parse: z.number().parse,
});

export class DenmarkBuildPhase extends BuildPhase {
  private readonly ferryClaimCount = injectState(FERRY_CLAIM_COUNT);

  onStartTurn(): void {
    this.ferryClaimCount.initState(0);
    return super.onStartTurn();
  }

  onEndTurn(): void {
    this.ferryClaimCount.delete();
    return super.onEndTurn();
  }
}

export class DenmarkConnectCitiesAction extends ConnectCitiesAction {
  private readonly ferryClaimCount = injectState(FERRY_CLAIM_COUNT);

  validate(data: ConnectCitiesData): void {
    assert(this.ferryClaimCount() < 2, {
      invalidInput: "Can only claim two ferry routes per turn",
    });

    return super.validate(data);
  }

  process(data: ConnectCitiesData): boolean {
    this.ferryClaimCount.set(this.ferryClaimCount() + 1);
    return super.process(data);
  }
}

export class DenmarkBuildValidator extends Validator {
  // Allow builds from an otherwise unconnected town to build a connection to a ferry link and then be considered connected
  protected newTrackExtendsPrevious(
    playerColor: PlayerColor,
    space: Land,
    newTracks: TrackInfo[],
  ): boolean {
    if (space.hasTown()) {
      const mapData = space.getMapSpecific(DenmarkMapData.parse);
      if (mapData?.ferryLinks) {
        for (const ferryLink of mapData.ferryLinks) {
          const linkedCity = this.grid()
            .cities()
            .find((city) => city.name() === ferryLink.city)!;
          const hasFerryConnection = this.grid().connections.some(
            (connection) =>
              connection.owner != null &&
              arrayEqualsIgnoreOrder(connection.connects, [
                space.coordinates,
                linkedCity.coordinates,
              ]),
          );

          if (hasFerryConnection) {
            for (const newTrack of newTracks) {
              if (newTrack.exits.some((exit) => exit === ferryLink.direction)) {
                return true;
              }
            }
          }
        }
      }
    }

    return super.newTrackExtendsPrevious(playerColor, space, newTracks);
  }

  protected connectionAllowed(
    land: Land,
    exit: Direction,
  ): InvalidBuildReason | undefined {
    // Allow builds that are establishing ferry links
    const mapData = land.getMapSpecific(DenmarkMapData.parse);
    if (mapData?.ferryLinks !== undefined) {
      for (const ferryLink of mapData.ferryLinks) {
        if (exit === ferryLink.direction) {
          return undefined;
        }
      }
    }

    return super.connectionAllowed(land, exit);
  }

  // Town discs should be considered unlimited in this map
  protected townDiscCount(): number {
    return 99;
  }
}

export class DenmarkBuildAction extends BuildAction {
  private readonly moveValidator = inject(MoveValidator);

  process(data: BuildData): boolean {
    const result = super.process(data);

    // Validate that this build has not resulted in any player having multiple direct links between two locations
    for (const space of this.grid().values()) {
      if (space instanceof City || space.hasTown()) {
        const routes = this.moveValidator.findRoutesFromLocation(
          space.coordinates,
        );
        assert(!hasDuplicateOwnedRoute(routes), {
          invalidInput:
            "A player cannot have multiple direct routes between two locations",
        });
      }
    }

    // When a player builds a ferry-link connection from a town, they do not get ownership of the track.
    // Unset the ownership on the built link if this is applicable.
    const location = this.gridHelper.lookup(data.coordinates);
    assert(location instanceof Land);
    const mapData = location.getMapSpecific(DenmarkMapData.parse);
    if (mapData?.ferryLinks !== undefined) {
      for (const ferryLink of mapData.ferryLinks) {
        for (const track of location.getTrack()) {
          if (
            track.hasExit(ferryLink.direction) &&
            track.getOwner() !== undefined
          ) {
            this.gridHelper.setRouteOwner(track, undefined);
          }
        }
      }
    }

    return result;
  }
}

function hasDuplicateOwnedRoute(routes: RouteInfo[]): boolean {
  for (let i = 0; i < routes.length; i++) {
    const a = routes[i];
    if (a.owner === undefined) {
      continue;
    }
    for (let j = i + 1; j < routes.length; j++) {
      const b = routes[j];
      if (a.destination.equals(b.destination) && a.owner === b.owner) {
        return true;
      }
    }
  }
  return false;
}
