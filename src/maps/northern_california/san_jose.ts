import { City } from "../../engine/map/city";
import { Space } from "../../engine/map/grid";
import { MoveHelper } from "../../engine/move/helper";
import { MoveData, Path } from "../../engine/move/move";
import {
  MoveValidator,
  RouteInfo,
  Teleport,
} from "../../engine/move/validator";
import { PlayerData } from "../../engine/state/player";
import { Coordinates } from "../../utils/coordinates";
import { isSanJose } from "./grid";

interface AdditionalPathData {
  teleport?: boolean;
}

function isTeleport(data: Path): boolean {
  if (data.additionalData == null) return false;
  const additionalData = data.additionalData as AdditionalPathData;
  return additionalData.teleport ?? false;
}

function isSanJoseSpace(space: Space | undefined): space is City {
  return space instanceof City && isSanJose(space.data);
}

export class NorthernCaliforniaMoveHelper extends MoveHelper {
  isWithinLocomotive(player: PlayerData, moveData: MoveData): boolean {
    const ignoringTeleport = moveData.path.filter((data) => !isTeleport(data));
    return ignoringTeleport.length <= this.getLocomotive(player);
  }
}

export class NorthernCaliforniaMoveValidator extends MoveValidator {
  findRoutesToLocation(
    player: PlayerData,
    fromCoordinates: Coordinates,
    toCoordinates: Coordinates,
  ): RouteInfo[] {
    return super
      .findRoutesToLocation(player, fromCoordinates, toCoordinates)
      .concat(this.findSanJoseTeleportRoutes(fromCoordinates, toCoordinates));
  }

  private findSanJoseTeleportRoutes(
    fromCoordinates: Coordinates,
    toCoordinates: Coordinates,
  ): Teleport[] {
    const origin = this.grid().get(fromCoordinates);
    const destination = this.grid().get(toCoordinates);
    if (!isSanJoseSpace(origin) || !isSanJoseSpace(destination)) return [];
    if (origin.coordinates.equals(destination.coordinates)) return [];
    return [
      {
        type: "teleport",
        destination: toCoordinates,
        owner: undefined,
      },
    ];
  }
}
