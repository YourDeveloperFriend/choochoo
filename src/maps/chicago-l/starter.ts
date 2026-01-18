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
import { fail } from "../../utils/validate";
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

    const startingGovtCity = this.getStartingCityName(
      this.random.rollDie() + this.random.rollDie(),
    );
    for (const city of this.gridHelper.findAllCities()) {
      if (city.name() === startingGovtCity) {
        this.log.log(
          "Government starting city selected as " +
            this.gridHelper.displayName(city.coordinates),
        );
        this.gridHelper.update(city.coordinates, (city) => {
          if (!city.mapSpecific) {
            city.mapSpecific = {};
          }
          city.mapSpecific.governmentStartingCity = true;
        });
      }
    }
  }

  private getStartingCityName(dieRoll: number): string {
    switch (dieRoll) {
      case 2:
        return "Midway";
      case 3:
        return "Dempster-Skokie";
      case 4:
        return "Linden";
      case 5:
        return "Damen";
      case 6:
        return "Addison";
      case 7:
        return "The Loop";
      case 8:
        return "Belmont";
      case 9:
        return "Cottage Grove";
      case 10:
        return "Cermak";
      case 11:
        return "Forest Park";
      case 12:
        return "O'Hare";
      default:
        fail("Invalid 2d6 die roll: " + dieRoll);
    }
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
