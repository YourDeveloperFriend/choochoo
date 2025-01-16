import {GameStarter} from "../../engine/game/starter";
import {assert} from "../../utils/validate";
import {SpaceType} from "../../engine/state/location_type";
import {PORT_CITIES} from "./port_cities";

export class GermanyStarter extends GameStarter {
  protected onStartGame(): void {
    super.onStartGame();

    const bag = [...this.bag()];
    for (let portCity of PORT_CITIES) {
      let color = bag.pop();
      assert(color !== undefined, "Bag cannot be emptied during setup");
      this.gridHelper.update(portCity, space => {
        assert(space.type === SpaceType.CITY);
        space.color = color;
      });
    }
    this.bag.set(bag);
  }
}
