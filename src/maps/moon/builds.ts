import { BuildAction, BuildData } from "../../engine/build/build";
import { BuilderHelper } from "../../engine/build/helper";
import { City } from "../../engine/map/city";
import { calculateTrackInfo } from "../../engine/map/location";
import { isTownTile } from "../../engine/map/tile";
import { TOWN, TrackInfo } from "../../engine/map/track";
import { Action } from "../../engine/state/action";
import { allDirections } from "../../engine/state/tile";
import { assert } from "../../utils/validate";

export class MoonBuildHelper extends BuilderHelper {
  getMaxBuilds(): number {
    return this.currentPlayer().selectedAction === Action.ENGINEER ? 3 : 2;
  }
}

export class MoonBuildAction extends BuildAction {
  validate(data: BuildData): void {
    super.validate(data);
    const buildInfo = calculateTrackInfo(data);
    const checkConnection = (track: TrackInfo) =>
      track.exits.some((exit) => {
        if (exit === TOWN) return false;

        if (this.grid().getTrackConnection(data.coordinates, exit) != null) {
          return true;
        }
        const neighbor = this.grid().getNeighbor(data.coordinates, exit);
        if (!(neighbor instanceof City)) return false;
        if (neighbor.name() === "Moon Base") return true;
        return allDirections.some(
          (direction) =>
            this.grid().getTrackConnection(neighbor.coordinates, direction) !=
            null,
        );
      });
    const allConnected = isTownTile(data.tileType)
      ? buildInfo.some(checkConnection)
      : buildInfo.every(checkConnection);
    assert(allConnected, { invalidInput: "must connect back to Moon Base" });
  }
}
