import { injectState } from "../../engine/framework/execution_context";
import { draw, GameStarter } from "../../engine/game/starter";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { PlayerColor, PlayerData } from "../../engine/state/player";
import { OnRoll } from "../../engine/state/roll";
import { SpaceData } from "../../engine/state/space";
import { TURN_TRACK_CUBES } from "./state";

const TURN_TRACK_SPOTS = 3;

export class MauiGameStarter extends GameStarter {
  private readonly turnTrackCubes = injectState(TURN_TRACK_CUBES);

  /** New City A (the red urbanization) is removed from the game. */
  getAvailableCities(): Array<[Good | Good[], CityGroup, OnRoll]> {
    return super
      .getAvailableCities()
      .filter(
        ([_, group, onRoll]) => !(group === CityGroup.WHITE && onRoll === 3),
      );
  }

  /** Every New City tile starts with 2 cubes on it, immediately available for delivery. */
  protected numCubesForAvailableCity(): number {
    return 2;
  }

  /** New Cities start with cubes on the tile, so their goods growth column starts empty. */
  protected getGoodsGrowthGoodsFor(
    bag: Good[],
    cityColor: Good | Good[],
    urbanized: boolean,
  ): Array<undefined | Good> {
    if (urbanized) {
      return [];
    }
    return super.getGoodsGrowthGoodsFor(bag, cityColor, urbanized);
  }

  /** Every town starts with one cube. */
  protected drawCubesFor(
    bag: Good[],
    location: SpaceData,
    playerCount: number,
  ): SpaceData {
    if (location.type !== SpaceType.CITY && location.townName != null) {
      return { ...location, goods: draw(1, bag) };
    }
    return super.drawCubesFor(bag, location, playerCount);
  }

  protected buildPlayer(playerId: number, color: PlayerColor): PlayerData {
    return { ...super.buildPlayer(playerId, color), money: 16 };
  }

  /** A cube is placed above spots 2, 3, and 4 of the turn track. */
  protected onStartGame(): void {
    const bag = [...this.bag()];
    // Turn 1 has no cube.
    this.turnTrackCubes.initState([null, ...draw(TURN_TRACK_SPOTS, bag)]);
    this.bag.set(bag);
  }
}
