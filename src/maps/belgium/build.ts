import { BuilderHelper } from "../../engine/build/helper";
import { TileType } from "../../engine/state/tile";
import { Action } from "../../engine/state/action";
import { InvalidBuildReason, Validator } from "../../engine/build/validator";
import { Coordinates } from "../../utils/coordinates";
import { injectCurrentPlayer } from "../../engine/game/state";
import { isTownTile } from "../../engine/map/tile";
import { City } from "../../engine/map/city";
import { assert } from "../../utils/validate";
import { BuildAction, BuildData } from "../../engine/build/build";
import { SpaceType } from "../../engine/state/location_type";
import { countExits } from "../../engine/map/location";

export class BelgiumBuilderHelper extends BuilderHelper {
  getMaxBuilds(): number {
    return this.currentPlayer().selectedAction === Action.URBANIZATION ? 2 : 3;
  }
}

export class BelgiumBuildValidator extends Validator {
  private readonly currentPlayer = injectCurrentPlayer();

  tileMatchesTownType(
    coordinates: Coordinates,
    tileType: TileType,
  ): InvalidBuildReason | undefined {
    if (isTownTile(tileType) && countExits(tileType) % 2 !== 1) {
      return "can only place town tiles with an odd number of exits";
    }

    if (this.currentPlayer().selectedAction === Action.ENGINEER) {
      const space = this.grid().get(coordinates);
      assert(space !== undefined);
      if (space instanceof City) {
        return "cannot place track on a city";
      }
      if (space.hasTown() && !isTownTile(tileType)) {
        return "cannot place regular track on a town tile";
      }
      return undefined;
    }
    return super.tileMatchesTownType(coordinates, tileType);
  }
}

export class BelgiumBuildAction extends BuildAction {
  process(data: BuildData): boolean {
    const result = super.process(data);

    // Update the hex type to be a town
    if (isTownTile(data.tileType)) {
      this.gridHelper.update(data.coordinates, (loc) => {
        assert(loc.type !== SpaceType.CITY);
        loc.townName = "";
      });
    }

    return result;
  }
}
