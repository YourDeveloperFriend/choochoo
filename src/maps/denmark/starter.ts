import { GameStarter } from "../../engine/game/starter";
import { assert } from "../../utils/validate";
import { SpaceType } from "../../engine/state/location_type";
import { Good } from "../../engine/state/good";
import { SpaceData } from "../../engine/state/space";
import { PlayerColor, PlayerData } from "../../engine/state/player";

export class DenmarkStarter extends GameStarter {
  protected onStartGame(): void {
    super.onStartGame();

    // Draw a random cube to determine Europe's color
    const bag = [...this.bag()];
    for (const space of this.gridHelper.all()) {
      if (space.name() == "Europe") {
        const color = bag.pop();
        assert(color !== undefined, "Bag cannot be emptied during setup");
        this.gridHelper.update(space.coordinates, (loc) => {
          assert(loc.type === SpaceType.CITY);
          loc.color = color;
        });
      }
    }
    this.bag.set(bag);
  }

  // Also a goods cube to every town
  protected drawCubesFor(
    bag: Good[],
    location: SpaceData,
    playerCount: number,
  ): SpaceData {
    if (location.type !== SpaceType.CITY && location.townName != null) {
      const cube = bag.pop();
      assert(cube !== undefined);
      return {
        ...location,
        goods: [cube],
      };
    }
    return super.drawCubesFor(bag, location, playerCount);
  }

  protected buildPlayer(playerId: number, color: PlayerColor): PlayerData {
    return {
      ...super.buildPlayer(playerId, color),
      money: 12,
      shares: 0,
      income: -4,
    };
  }
}
