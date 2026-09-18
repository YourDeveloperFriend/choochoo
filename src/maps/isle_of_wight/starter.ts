import { injectState } from "../../engine/framework/execution_context";
import { draw, GameStarter } from "../../engine/game/starter";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { SpaceData } from "../../engine/state/space";
import {
  HAGGLE_COUPONS,
  HIGHEST_TIER_BOUGHT,
  PLAYER_TRAINS,
  TRAIN_DECK,
} from "./state";
import { TRAIN_TIERS } from "./train_data";

export class IsleOfWightStarter extends GameStarter {
  private readonly deck = injectState(TRAIN_DECK);
  private readonly playerTrains = injectState(PLAYER_TRAINS);
  private readonly coupons = injectState(HAGGLE_COUPONS);
  private readonly highestTierBought = injectState(HIGHEST_TIER_BOUGHT);
  private readonly playerCount = injectInitialPlayerCount();

  protected onStartGame(): void {
    super.onStartGame();

    const playerCount = this.playerCount();
    this.deck.initState(
      new Map(TRAIN_TIERS.map(({ tier, count }) => [tier, count(playerCount)])),
    );
    this.playerTrains.initState(
      new Map(this.turnOrder().map((color) => [color, []])),
    );
    this.coupons.initState(
      new Map(this.turnOrder().map((color) => [color, 0])),
    );
    this.highestTierBought.initState(0);
  }

  /** Each town starts with one cube on it. */
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

  /** New city tiles come with their cubes already on them. */
  protected numCubesForAvailableCity(): number {
    return this.playerCount() === 3 ? 2 : 3;
  }

  isGoodsGrowthEnabled(): boolean {
    return false;
  }
}
