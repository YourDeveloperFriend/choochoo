import { injectState } from "../../engine/framework/execution_context";
import { draw, GameStarter } from "../../engine/game/starter";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { PlayerColor, PlayerData } from "../../engine/state/player";
import { OnRoll } from "../../engine/state/roll";
import { SpaceData } from "../../engine/state/space";
import { duplicate } from "../../utils/functions";
import { DELIVERY_RESTRICTION } from "./delivery";
import { Dimension } from "./map_data";

export class SoulTrainStarter extends GameStarter {
  private readonly restriction = injectState(DELIVERY_RESTRICTION);

  protected onStartGame(): void {
    this.restriction.initState({ from: Dimension.HELL, to: Dimension.EARTH });
  }

  isGoodsGrowthEnabled(): boolean {
    return false;
  }

  initializeStartingCubes() {
    this.bag.initState(
      this.random.shuffle([
        ...duplicate(6, Good.RED),
        ...duplicate(6, Good.PURPLE),
        ...duplicate(6, Good.YELLOW),
        ...duplicate(6, Good.BLUE),
        ...duplicate(6, Good.BLACK),
      ]),
    );
  }

  protected drawCubesFor(
    bag: Good[],
    location: SpaceData,
    playerCount: number,
  ): SpaceData {
    if (location.type === SpaceType.FIRE && location.townName != null) {
      if (
        location.townName !== "September" &&
        location.townName !== "Car Wash"
      ) {
        return { ...location, goods: draw(1, bag) };
      }
    }
    return super.drawCubesFor(bag, location, playerCount);
  }

  getAvailableCities(): Array<[Good | Good[], CityGroup, OnRoll]> {
    return super
      .getAvailableCities()
      .filter((city) => city[0] !== Good.BLACK || city[2] === 5);
  }

  protected buildPlayer(playerId: number, color: PlayerColor): PlayerData {
    return {
      ...super.buildPlayer(playerId, color),
      money: 20,
    };
  }
}
