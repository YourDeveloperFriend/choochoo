import { GameKey } from "../../api/game_key";
import { inject } from "../../engine/framework/execution_context";
import {
  JACK,
  MapSettings,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { goodToString } from "../../engine/state/good";
import { interCityConnections } from "../factory";
import { GermanyActionNamingProvider } from "./actions";
import {
  GermanyBuildAction,
  GermanyBuilderHelper,
  GermanyBuildPhase,
} from "./build";
import { GermanyCostCalculator } from "./cost";
import { map } from "./grid";
import { GermanyMoveHelper } from "./move";
import { GermanyStarter } from "./starter";

export class GermanyMapSettings implements MapSettings {
  static readonly key = GameKey.GERMANY;
  readonly key = GermanyMapSettings.key;
  readonly name = "Germany";
  readonly designer = "John Bohrer";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly interCityConnections = interCityConnections(map, [
    { connects: ["Düsseldorf", "Essen"] },
  ]);
  readonly stage = ReleaseStage.BETA;

  getOverrides() {
    return [
      GermanyCostCalculator,
      GermanyMoveHelper,
      GermanyStarter,
      GermanyBuilderHelper,
      GermanyBuildAction,
      GermanyBuildPhase,
      GermanyGoodsGrowth,
      GermanyActionNamingProvider,
    ];
  }
}

class GermanyGoodsGrowth extends GoodsGrowthPhase {
  protected readonly helper = inject(GoodsHelper);

  onStart(): void {
    super.onStart();
    const berlin = [...this.gridHelper.findAllCities()].find(
      (city) => city.data.name === "Berlin",
    )!;
    const currentBerlinGoods = berlin.getGoods();
    const newGood = this.helper.drawGood();
    this.gridHelper.update(berlin.coordinates, (cityData) => {
      cityData.goods = [...currentBerlinGoods, newGood];
    });
    this.log.log(`A ${goodToString(newGood)} good is added to Berlin (J9)`);
  }
}
