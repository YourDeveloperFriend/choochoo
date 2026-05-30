import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import {
  ActionProcessor,
  EmptyActionProcessor,
} from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { BAG, injectGrid } from "../../engine/game/state";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { GridHelper } from "../../engine/map/grid_helper";
import { City } from "../../engine/map/city";
import { ROUND } from "../../engine/game/round";
import { Key } from "../../engine/framework/key";
import { CityGroup } from "../../engine/state/city_group";
import { GoodZod, goodToString } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { CoordinatesZod } from "../../utils/coordinates";
import { PlayerColor } from "../../engine/state/player";
import { assert } from "../../utils/validate";
import { MexicoRoleHelper } from "./roles";

export const MEXICO_PRODUCTION_GOODS = new Key("mexicoProductionGoods", {
  parse: z.array(GoodZod).parse,
});

export class MexicoProductionPassAction extends EmptyActionProcessor {
  static readonly action = "mexicoProductionPass";

  private readonly productionGoods = injectState(MEXICO_PRODUCTION_GOODS);
  private readonly log = inject(Log);

  canEmit(): boolean {
    return this.productionGoods().length === 0;
  }

  process(): boolean {
    this.log.currentPlayer("skips production");
    return true;
  }
}

export class MexicoProductionDrawAction extends EmptyActionProcessor {
  static readonly action = "mexicoProductionDraw";

  private readonly productionGoods = injectState(MEXICO_PRODUCTION_GOODS);
  private readonly bag = injectState(BAG);
  private readonly helper = inject(GoodsHelper);
  private readonly log = inject(Log);

  canEmit(): boolean {
    return this.productionGoods().length === 0 && this.bag().length > 0;
  }

  process(): boolean {
    const goods = this.helper.drawGoods(2);
    this.productionGoods.update((box) => box.push(...goods));
    this.log.currentPlayer(`draws ${goods.map(goodToString).join(", ")}`);
    return false;
  }
}

const PlaceProductionData = z.object({
  coordinates: CoordinatesZod,
  good: GoodZod,
});
type PlaceProductionData = z.infer<typeof PlaceProductionData>;

export class MexicoProductionPlaceAction
  implements ActionProcessor<PlaceProductionData>
{
  static readonly action = "mexicoProductionPlace";
  readonly assertInput = PlaceProductionData.parse;

  private readonly productionGoods = injectState(MEXICO_PRODUCTION_GOODS);
  private readonly grid = injectGrid();
  private readonly gridHelper = inject(GridHelper);
  private readonly log = inject(Log);

  canEmit(): boolean {
    return this.productionGoods().length > 0;
  }

  validate({ coordinates, good }: PlaceProductionData): void {
    assert(this.productionGoods().includes(good), {
      invalidInput: "must place one of the drawn goods",
    });
    assert(this.grid().get(coordinates) instanceof City, {
      invalidInput: "must place on a city",
    });
  }

  process({ coordinates, good }: PlaceProductionData): boolean {
    const city = this.grid().get(coordinates);
    assert(city instanceof City);
    this.gridHelper.update(coordinates, (space) => {
      assert(space.type === SpaceType.CITY);
      space.goods.push(good);
    });
    this.log.currentPlayer(`places a ${goodToString(good)} in ${city.name()}`);
    this.productionGoods.update((box) => {
      box.splice(box.indexOf(good), 1);
    });
    return true;
  }
}

export class MexicoGoodsGrowthPhase extends GoodsGrowthPhase {
  private readonly round = injectState(ROUND);
  private readonly roles = inject(MexicoRoleHelper);
  private readonly productionGoods = injectState(MEXICO_PRODUCTION_GOODS);

  configureActions(): void {
    this.installAction(MexicoProductionPassAction);
    this.installAction(MexicoProductionDrawAction);
    this.installAction(MexicoProductionPlaceAction);
  }

  getPlayerOrder(): PlayerColor[] {
    if (this.round() >= 9) return [];
    return [this.roles.getCartelColor()];
  }

  getRollCount(cityGroup: CityGroup): number {
    if (this.round() >= 9) return 0;
    return super.getRollCount(cityGroup);
  }

  onStartTurn(): void {
    this.productionGoods.initState([]);
    this.goodsGrowthState.initState({ goods: [] });
  }

  onEndTurn(): void {
    const remaining = this.productionGoods();
    if (remaining.length > 0) {
      this.bag.update((bag) => bag.push(...remaining));
    }
    this.productionGoods.delete();
    super.onEndTurn();
  }
}
