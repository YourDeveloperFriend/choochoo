import { GameStarter, draw } from "../../engine/game/starter";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { SpaceData } from "../../engine/state/space";
import { connectionsForPlayers } from "./connections";

export class HoneybeeStarter extends GameStarter {
  protected startingBag(): Good[] {
    // All twenty yellow cubes are reserved for the fixed board/display setup.
    return super.startingBag().filter((good) => good !== Good.YELLOW);
  }

  protected drawCubesFor(
    bag: Good[],
    location: SpaceData,
    playerCount: number,
  ): SpaceData {
    if (location.type !== SpaceType.CITY) {
      return location;
    }
    const isLarge = location.sameCity != null;
    const isCenter = location.onRoll.some(
      (roll) => roll.group === CityGroup.WHITE && roll.onRoll === 5,
    );
    return {
      ...location,
      goods: this.getPlacedGoodsFor(bag, playerCount, location).concat(
        !isCenter && location.onRoll.length > 0 ? [Good.YELLOW] : [],
      ),
      onRoll: location.onRoll.map((roll) => ({
        ...roll,
        goods: isLarge
          ? draw(3, bag)
          : [draw(1, bag)[0], Good.YELLOW, draw(1, bag)[0]],
      })),
    };
  }

  getAvailableCities() {
    return super
      .getAvailableCities()
      .filter(([, group, roll]) => !(group === CityGroup.BLACK && roll === 1));
  }

  protected numCubesForAvailableCity(): number {
    return this.players().length === 5 ? 1 : 0;
  }

  protected onStartGame(): void {
    super.onStartGame();
    this.interCityConnections.set(connectionsForPlayers(this.players().length));
  }
}
