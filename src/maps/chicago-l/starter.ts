import { GameStarter } from "../../engine/game/starter";
import {
  eligiblePlayerColors,
  PlayerColor,
  PlayerColorZod,
} from "../../engine/state/player";
import { remove } from "../../utils/functions";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key, MapKey } from "../../engine/framework/key";
import z from "zod";
import { Log } from "../../engine/game/log";
import { Good, GoodZod } from "../../engine/state/good";

export const GOVERNMENT_COLOR = PlayerColor.PURPLE;

export const GOVERNMENT_ENGINE_LEVEL = new MapKey(
  "CHICAGOL_GOVT_ENGINE",
  PlayerColorZod.parse,
  z.number().parse,
);
export const THE_LOOP_DEMAND = new Key(
  "CHICAGOL_THE_LOOP_DEMAND",
  GoodZod.array(),
);

export class ChicagoLStarter extends GameStarter {
  private readonly govtEngineLevel = injectState(GOVERNMENT_ENGINE_LEVEL);
  private readonly theLoopDemand = injectState(THE_LOOP_DEMAND);
  private readonly log = inject(Log);

  onStartGame(): void {
    this.govtEngineLevel.initState(
      new Map(this.players().map((player) => [player.color, 0])),
    );

    const bag = [...this.bag()];
    const loopDemandDraws: Good[] = this.random.draw(9, bag, true);
    this.bag.set(bag);
    this.theLoopDemand.initState(loopDemandDraws);

    const cities = [...this.gridHelper.findAllCities()];
    const startingCity = cities[this.random.random(cities.length)];
    this.log.log(
      "Government starting city selected as " +
        this.gridHelper.displayName(startingCity.coordinates),
    );
    this.gridHelper.update(startingCity.coordinates, (city) => {
      if (!city.mapSpecific) {
        city.mapSpecific = {};
      }
      city.mapSpecific.governmentStartingCity = true;
    });
  }

  protected numCubesForAvailableCity(): number {
    return 2;
  }

  eligiblePlayerColors(): PlayerColor[] {
    return remove(eligiblePlayerColors, GOVERNMENT_COLOR);
  }

  isGoodsGrowthEnabled(): boolean {
    return false;
  }
}
