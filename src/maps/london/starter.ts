import { GameStarter } from "../../engine/game/starter";
import { assert } from "../../utils/validate";

export class LondonStarter extends GameStarter {
  protected onStartGame(): void {
    super.onStartGame();

    const bag = [...this.bag()];
    for (const space of this.gridHelper.all()) {
      const name = space.name();
      if (name && ['Fulham', "St. John's Wood", 'Brixton', 'Deptford'].indexOf(name) !== -1) {
        const color = bag.pop();
        assert(color !== undefined, "Bag cannot be emptied during setup");
        this.gridHelper.update(space.coordinates, (loc) => {
          if (loc.goods === undefined) {
            loc.goods = [color];
          } else {
            loc.goods.push(color);
          }
        });
      }
    }
    this.bag.set(bag);
  }
}
