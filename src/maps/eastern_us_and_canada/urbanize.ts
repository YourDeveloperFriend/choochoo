import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Random } from "../../engine/game/random";
import { BAG } from "../../engine/game/state";
import { Good, goodToString } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { assert } from "../../utils/validate";
import { Land } from "../../engine/map/location";
import { TOWN } from "../../engine/map/track";
import { allDirections, Direction } from "../../engine/state/tile";
import { PlayerColor } from "../../engine/state/player";
import { City } from "../../engine/map/city";
import {BuilderHelper} from "../../engine/build/helper";

export class EasternUsAndCanadaUrbanizeAction extends UrbanizeAction {
  private readonly bag = injectState(BAG);
  private readonly random = inject(Random);

  validate(data: UrbanizeData) {
    super.validate(data);
    assert(this.helper.buildCount() === 0, { invalidInput: 'urbanization must be done before track builds' });
  }

  process(data: UrbanizeData): boolean {
    const grid = this.grid();

    // Get a list of existing links from this town to neighboring cities
    const convertToConnection: Array<{
      direction: Direction;
      owner: PlayerColor | undefined;
    }> = [];
    const space = grid.get(data.coordinates);
    assert(space instanceof Land);
    for (const track of space.getTrack()) {
      const exit = track.getExits().find((exit) => exit !== TOWN);
      assert(exit !== undefined);
      const neighbor = grid.getNeighbor(data.coordinates, exit);
      if (neighbor instanceof City) {
        convertToConnection.push({ direction: exit, owner: track.getOwner() });
      }
    }

    const result = super.process(data);

    let pull: Good[];
    this.bag.update((bag) => {
      pull = this.random.draw(2, bag, false);
    });

    this.gridHelper.update(data.coordinates, (city) => {
      assert(city.type === SpaceType.CITY);
      for (const good of pull) {
        this.log.log(
          `A ${goodToString(good)} good is added to ${this.gridHelper.displayName(data.coordinates)} during urbanization`,
        );
        city.goods.push(good);
      }
    });

    // Convert existing links to new intercity connections
    for (const newConnection of convertToConnection) {
      this.gridHelper.addInterCityConnection({
        connects: [
          data.coordinates,
          data.coordinates.neighbor(newConnection.direction),
        ],
        cost: 0,
        owner: { color: newConnection.owner },
      });
    }
    // Also add an unowned intercity connection in each direction
    for (const direction of allDirections) {
      const neighbor = grid.getNeighbor(data.coordinates, direction);
      if (neighbor instanceof City) {
        const cost = convertToConnection.some(
          (newConnection) => newConnection.direction === direction,
        )
          ? 3
          : 2;
        this.gridHelper.addInterCityConnection({
          connects: [data.coordinates, neighbor.coordinates],
          cost: cost,
        });
      }
    }

    return result;
  }
}
