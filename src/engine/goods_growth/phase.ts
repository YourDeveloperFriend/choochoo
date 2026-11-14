import { inject, injectState } from "../framework/execution_context";
import { Log } from "../game/log";
import { PhaseModule } from "../game/phase_module";
import { Random } from "../game/random";
import {
  BAG,
  injectInitialPlayerCount,
  injectPlayerAction,
} from "../game/state";
import { City } from "../map/city";
import { GridHelper } from "../map/grid_helper";
import { Action } from "../state/action";
import { CityGroup, cityGroupToString } from "../state/city_group";
import { goodToString } from "../state/good";
import { Phase } from "../state/phase";
import { PlayerColor } from "../state/player";
import { OnRollData } from "../state/roll";
import { GoodsHelper } from "./helper";
import { PassAction } from "./pass";
import { ProductionAction } from "./production";
import { GOODS_GROWTH_STATE } from "./state";

export class GoodsGrowthPhase extends PhaseModule {
  static readonly phase = Phase.GOODS_GROWTH;

  protected readonly log = inject(Log);
  protected readonly gridHelper = inject(GridHelper);
  protected readonly playerCount = injectInitialPlayerCount();
  protected readonly productionPlayer = injectPlayerAction(Action.PRODUCTION);
  protected readonly bag = injectState(BAG);
  protected readonly goodsGrowthState = injectState(GOODS_GROWTH_STATE);
  protected readonly helper = inject(GoodsHelper);
  protected readonly random = inject(Random);

  configureActions(): void {
    this.installAction(ProductionAction);
    this.installAction(PassAction);
  }

  onStartTurn(): void {
    super.onStartTurn();
    const goods = this.helper.drawGoods(2);
    const asColors = goods.map(goodToString);
    this.log.currentPlayer(`draws ${asColors.join(", ")}`);
    this.goodsGrowthState.initState({ goods });
  }

  onEndTurn(): void {
    if (this.goodsGrowthState().goods.length > 0) {
      this.bag.update((bag) => bag.push(...this.goodsGrowthState().goods));
    }
    this.goodsGrowthState.delete();
    super.onEndTurn();
  }

  getPlayerOrder(): PlayerColor[] {
    const productionPlayer = this.productionPlayer();
    if (productionPlayer == null) {
      return [];
    }
    if (!this.helper.hasCityOpenings()) {
      this.log.player(
        productionPlayer,
        "has to forfeit production due to no openings",
      );
      return [];
    }
    return [productionPlayer.color];
  }

  getRollCount(_: CityGroup): number {
    return this.playerCount();
  }

  /** Whether a roll for `rollGroup` applies to one of `city`'s chart entries. */
  rollAppliesTo(rollGroup: CityGroup, _: City, onRoll: OnRollData): boolean {
    return rollGroup === onRoll.group;
  }

  onEnd(): void {
    for (const cityGroup of [CityGroup.WHITE, CityGroup.BLACK]) {
      const rolls = this.random.rollDice(this.getRollCount(cityGroup)).sort();
      if (rolls.length === 0) continue;
      this.log.log(
        `${cityGroupToString(cityGroup)} rolled ${rolls.join(", ")}`,
      );
      const cities = this.gridHelper.findAllCities();
      for (const city of cities) {
        for (const [index, entry] of city.onRoll().entries()) {
          if (!this.rollAppliesTo(cityGroup, city, entry)) continue;
          const numRolled = rolls.filter((r) => r === entry.onRoll).length;
          this.helper.moveGoodsToCity(city.coordinates, index, numRolled);
        }
      }
    }
  }
}
