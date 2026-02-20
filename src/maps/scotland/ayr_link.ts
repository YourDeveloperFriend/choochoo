import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { Land } from "../../engine/map/location";
import { PlayerColor } from "../../engine/state/player";
import { Direction } from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";
import { assert } from "../../utils/validate";

/** This is the most intuitive reading of the rules and we'll stick with this implementation until either Kevin Duffy or Randal give us a reason not to. */
export class ScotlandUrbanizeAction extends UrbanizeAction {
  process(data: UrbanizeData) {
    if (!this.isAyr(data.coordinates)) {
      return super.process(data);
    }
    const connectionOwner = this.getAyrConnectionOwner(data.coordinates);
    const result = super.process(data);
    this.gridHelper.addInterCityConnection({
      connects: [
        data.coordinates,
        data.coordinates.neighbor(Direction.TOP_RIGHT),
      ],
      cost: 2,
      owner: connectionOwner,
    });
    return result;
  }

  private getAyrConnectionOwner(
    coordinates: Coordinates,
  ): { color?: PlayerColor } | undefined {
    const space = this.grid().get(coordinates);
    assert(space instanceof Land);
    const track = space.trackExiting(Direction.TOP_RIGHT);
    if (track == null) return undefined;
    return { color: track.getOwner() };
  }

  private isAyr(coordinates: Coordinates): boolean {
    const space = this.grid().get(coordinates);
    return space instanceof Land && space.name() === "Ayr";
  }
}
