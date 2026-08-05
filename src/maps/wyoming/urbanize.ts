import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { assert } from "../../utils/validate";
import { Coordinates } from "../../utils/coordinates";
import { Land } from "../../engine/map/location";
import { PlayerColor } from "../../engine/state/player";
import { Direction } from "../../engine/state/tile";
import { LARAMIE } from "./grid";

export class WyomingUrbanizeAction extends UrbanizeAction {
  process(data: UrbanizeData) {
    if (!this.isLaramie(data.coordinates)) {
      return super.process(data);
    }
    const connectionOwner = this.getLaramieConnectionOwner(data.coordinates);
    const result = super.process(data);
    this.gridHelper.addInterCityConnection({
      connects: [data.coordinates, data.coordinates.neighbor(Direction.BOTTOM)],
      cost: 2,
      owner: connectionOwner ? { color: connectionOwner } : undefined,
    });
    return result;
  }

  private getLaramieConnectionOwner(
    coordinates: Coordinates,
  ): PlayerColor | undefined {
    const space = this.grid().get(coordinates);
    assert(space instanceof Land);
    const track = space.trackExiting(Direction.BOTTOM);
    if (track == null) return undefined;
    return track.getOwner();
  }

  private isLaramie(coordinates: Coordinates): boolean {
    const space = this.grid().get(coordinates);
    return space instanceof Land && space.name() === LARAMIE;
  }
}
