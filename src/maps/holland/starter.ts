import { injectState, inject } from "../../engine/framework/execution_context";
import { GameMemory } from "../../engine/game/game_memory";
import { GameStarter } from "../../engine/game/starter";
import { Action } from "../../engine/state/action";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { OnRoll } from "../../engine/state/roll";
import { HOLLAND_INITIAL_DISABLED_ACTION } from "./allowed_actions";
import { HollandMapData } from "./grid";
import { HollandVariantConfig } from "./variant_config";

export class HollandStarter extends GameStarter {
  private readonly gameMemory = inject(GameMemory);
  private readonly initialDisabledAction = injectState(
    HOLLAND_INITIAL_DISABLED_ACTION,
  );

  getAvailableCities(): Array<[Good | Good[], CityGroup, OnRoll]> {
    return super
      .getAvailableCities()
      .filter(([color]) =>
        Array.isArray(color)
          ? !color.includes(Good.YELLOW)
          : color !== Good.YELLOW,
      );
  }

  protected onBeginStartGame(): void {
    super.onBeginStartGame();
    this.initialDisabledAction.initState(
      this.random.shuffle([Action.URBANIZATION, Action.ENGINEER])[0],
    );
  }

  protected onStartGame(): void {
    super.onStartGame();
    const { windmillVariant } = this.gameMemory.getVariant(
      HollandVariantConfig.parse,
    );
    if (!windmillVariant) {
      return;
    }
    const bag = [...this.bag()];
    for (const [coordinates, space] of this.grid()) {
      if (space.type === SpaceType.CITY) {
        continue;
      }
      const mapSpecific = HollandMapData.parse(space.mapSpecific ?? {});
      if (!mapSpecific.windmill) {
        continue;
      }
      const good = this.random.draw(1, bag, false);
      if (good.length === 0) {
        continue;
      }
      this.gridHelper.update(coordinates, (land) => {
        if (land.type === SpaceType.CITY) {
          return;
        }
        land.goods = [...(land.goods ?? []), good[0]];
      });
    }
    this.bag.set(bag);
  }
}
