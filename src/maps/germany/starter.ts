import {GameStarter} from "../../engine/game/starter";
import {assert} from "../../utils/validate";
import {SpaceType} from "../../engine/state/location_type";
import {GermanyMapData} from "./grid";

export class GermanyStarter extends GameStarter {
  protected onStartGame(): void {
    super.onStartGame();

    const bag = [...this.bag()];
    for (let space of this.gridHelper.all()) {
      const mapData = space.getMapSpecific(GermanyMapData.parse);
      if (mapData && mapData.portCity) {
        const color = bag.pop();
        assert(color !== undefined, "Bag cannot be emptied during setup");
        this.gridHelper.update(space.coordinates, loc => {
          assert(loc.type === SpaceType.CITY);
          loc.color = color;
        });
      }
    }
    this.bag.set(bag);
  }
}
