import { inject } from "../../engine/framework/execution_context";
import { GameMemory } from "../../engine/game/game_memory";
import { PuertoRicoVariantConfig } from "../../api/variant_config";
import { GameStarter, draw } from "../../engine/game/starter";
import { Good } from "../../engine/state/good";
import { duplicate } from "../../utils/functions";
import { SpaceData } from "../../engine/state/space";
import { SpaceType } from "../../engine/state/location_type";
import { CityGroup } from "../../engine/state/city_group";
import { OnRoll } from "../../engine/state/roll";

export class PuertoRicoStarter extends GameStarter {
  private readonly gameMemory = inject(GameMemory);

  protected startingBag(): Good[] {
    const variant = this.gameMemory.getVariant(PuertoRicoVariantConfig.parse);

    switch (variant.difficulty) {
      case "novicio":
        return [...duplicate(17, Good.RED), ...duplicate(5, Good.BLACK)];
      case "estudiante":
        return [...duplicate(16, Good.RED), ...duplicate(6, Good.BLACK)];
      case "versado":
        return [...duplicate(15, Good.RED), ...duplicate(7, Good.BLACK)];
      case "maestro":
        return [...duplicate(14, Good.RED), ...duplicate(8, Good.BLACK)];
      case "conquistador":
        return [...duplicate(13, Good.RED), ...duplicate(9, Good.BLACK)];
      case "dios":
        return [...duplicate(12, Good.RED), ...duplicate(10, Good.BLACK)];
    }
  }

  public getAvailableCities(): Array<[Good | Good[], CityGroup, OnRoll]> {
    return [];
  }

  public isGoodsGrowthEnabled(): boolean {
    return false;
  }

  protected drawCubesFor(bag: Good[], location: SpaceData): SpaceData {

    if (location.type !== SpaceType.CITY && location.townName != null) {
      return {
        ...location,
        goods: draw(2, bag),
      };
    }

    return location;
  }

  
}
