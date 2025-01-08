import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { ActionProcessor } from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { PhaseEngine } from "../../engine/game/phase";
import { PhaseDelegator } from "../../engine/game/phase_delegator";
import { PhaseModule } from "../../engine/game/phase_module";
import { BAG, injectGrid, injectPlayerAction } from "../../engine/game/state";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { City } from "../../engine/map/city";
import { GridHelper } from "../../engine/map/grid_helper";
import { Action } from "../../engine/state/action";
import { goodToString, GoodZod } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { CoordinatesZod } from "../../utils/coordinates";
import { remove } from "../../utils/functions";
import { assert } from "../../utils/validate";

const ProductionState = z.object({
  coordinates: CoordinatesZod,
  goods: GoodZod.array(),
});

const PRODUCTION_STATE = new Key('productionState', { parse: ProductionState.parse });

export class IndiaPhaseEngine extends PhaseEngine {
  phaseOrder(): Phase[] {
    const previous = super.phaseOrder();
    const index = previous.indexOf(Phase.GOODS_GROWTH);
    previous[index] = Phase.MANUAL_GOODS_GROWTH;
    return previous;
  }
}

export class IndiaPhaseDelegator extends PhaseDelegator {
  constructor() {
    super();
    this.install(IndiaGoodsGrowthPhase);
  }
}

export class IndiaGoodsGrowthPhase extends PhaseModule {
  static readonly phase = Phase.MANUAL_GOODS_GROWTH;

  protected readonly productionPlayer = injectPlayerAction(Action.PRODUCTION);

  configureActions(): void {
    this.installAction(SelectCityAction);
    this.installAction(SelectGoodAction);
  }

  getPlayerOrder(): PlayerColor[] {
    const productionPlayer = this.productionPlayer();
    if (productionPlayer == null) {
      return [];
    }
    return [productionPlayer.color];
  }
}

export const SelectCityData = z.object({
  coordinates: CoordinatesZod,
});
export type SelectCityData = z.infer<typeof SelectCityData>;

export class SelectCityAction implements ActionProcessor<SelectCityData> {
  static readonly action = 'select-city';
  readonly assertInput = SelectCityData.parse;
  private readonly grid = injectGrid();
  private readonly log = inject(Log);
  private readonly state = injectState(PRODUCTION_STATE);
  private readonly goodsHelper = inject(GoodsHelper);

  validate({ coordinates }: SelectCityData) {
    assert(!this.state.isInitialized, { invalidInput: 'cannot change selected city' });
    assert(this.grid().get(coordinates) instanceof City, { invalidInput: 'Must choose a city' });
  }

  process({ coordinates }: SelectCityData): boolean {
    this.state.initState({
      coordinates,
      goods: this.goodsHelper.drawGoods(2),
    });
    const city = this.grid().get(coordinates);
    assert(city instanceof City);
    this.log.currentPlayer(`selects ${city.name()
      }, draws ${this.state().goods.map(goodToString).join(', ')}`);
    return false;
  }
}

export const SelectGoodData = z.object({
  good: GoodZod,
});
export type SelectGoodData = z.infer<typeof SelectGoodData>;

export class SelectGoodAction implements ActionProcessor<SelectGoodData> {
  static readonly action = 'select-good';
  readonly assertInput = SelectGoodData.parse;

  private readonly log = inject(Log);
  private readonly state = injectState(PRODUCTION_STATE);
  private readonly bag = injectState(BAG);
  private readonly gridHelper = inject(GridHelper);

  validate({ good }: SelectGoodData) {
    assert(this.state.isInitialized(), { invalidInput: 'must select city first' });
    assert(this.state().goods.includes(good), { invalidInput: 'invalid good' });
  }

  process({ good }: SelectGoodData): boolean {
    const otherGoods = remove(this.state().goods, good);
    this.bag.update((bag) => bag.push(...otherGoods));
    this.gridHelper.update(this.state().coordinates, (city) => {
      assert(city.type === SpaceType.CITY);

      city.goods.push(good);
    });

    const city = this.gridHelper.lookup(this.state().coordinates);
    assert(city instanceof City);

    this.log.currentPlayer(`places ${goodToString(good)} in ${city.name()
      }, draws ${this.state().goods.map(goodToString).join(', ')}`);

    this.state.delete();
    return true;
  }
}
