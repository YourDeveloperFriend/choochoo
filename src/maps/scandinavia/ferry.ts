import z from "zod";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { City } from "../../engine/map/city";
import { Space } from "../../engine/map/grid";
import { MoveHelper } from "../../engine/move/helper";
import { MoveAction, MoveData, Path } from "../../engine/move/move";
import { MovePhase } from "../../engine/move/phase";
import {
  MoveValidator,
  RouteInfo,
  Teleport,
} from "../../engine/move/validator";
import { Action } from "../../engine/state/action";
import { PlayerData } from "../../engine/state/player";
import { Coordinates } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { ScandinaviaMapData } from "./map_data";

const USED_FERRY = new Key("usedFerry", { parse: z.boolean().parse });

export class ScandinaviaMoveHelper extends MoveHelper {
  isWithinLocomotive(player: PlayerData, moveData: MoveData): boolean {
    const ignoringTeleport = moveData.path.filter((data) => !isTeleport(data));
    return ignoringTeleport.length <= this.getLocomotive(player);
  }
}

interface AdditionalPathData {
  teleport?: boolean;
}

function isTeleport(data: Path): boolean {
  if (data.additionalData == null) return false;
  const additionalData = data.additionalData as AdditionalPathData;
  return additionalData.teleport ?? false;
}

export class ScandinaviaMoveAction extends MoveAction {
  private readonly usedFerry = injectState(USED_FERRY);
  process(action: MoveData): boolean {
    this.usedFerry.upsert(
      this.usedFerry.getOr(false) || action.path.some(isTeleport),
    );
    return super.process(action);
  }
}

export class ScandinaviaMovePhase extends MovePhase {
  private readonly usedFerry = injectState(USED_FERRY);
  onEnd(): void {
    if (this.usedFerry.isInitialized()) {
      this.usedFerry.delete();
    }
    super.onEnd();
  }
}

export class ScandinaviaMoveValidator extends MoveValidator {
  private readonly usedFerry = injectState(USED_FERRY);

  validatePartial(player: PlayerData, action: MoveData): void {
    super.validatePartial(player, action);

    const numTeleports = action.path.filter(isTeleport).length;
    if (player.selectedAction === Action.FERRY && !this.usedFerry) {
      assert(numTeleports <= 1, {
        invalidInput: "can only use the ferry once in a move",
      });
    } 
  }

  findRoutesToLocation(
    player: PlayerData,
    fromCoordinates: Coordinates,
    toCoordinates: Coordinates,
  ): RouteInfo[] {
    if(this.usedFerry.getOr(false)){
      return super.findRoutesToLocation(player, fromCoordinates, toCoordinates);
    }
    return super
      .findRoutesToLocation(player, fromCoordinates, toCoordinates)
      .concat(this.findTeleportRoutes(player, fromCoordinates, toCoordinates));
  }

  private findTeleportRoutes(
    player: PlayerData,
    fromCoordinates: Coordinates,
    toCoordinates: Coordinates,
  ): Teleport[] {
    if (player.selectedAction !== Action.FERRY) return [];
    const origin = this.grid().get(fromCoordinates);
    const destination = this.grid().get(toCoordinates);
    if (!isCoastalCity(origin) || !isCoastalCity(destination)) return [];
    return [
      {
        type: "teleport",
        destination: toCoordinates,
        owner: undefined,
      },
    ];
  }
}

function isCoastalCity(space: Space | undefined): boolean {
  if (!(space instanceof City)) return false;
  return space?.getMapSpecific(ScandinaviaMapData.parse)?.isCoastal ?? false;
}
