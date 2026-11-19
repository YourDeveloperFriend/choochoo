import z from "zod";
import { inject } from "../../engine/framework/execution_context";
import { ActionProcessor } from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { injectGrid } from "../../engine/game/state";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { PassAction } from "../../engine/goods_growth/pass";
import { GridHelper } from "../../engine/map/grid_helper";
import { GoodZod, allGoods, goodToString } from "../../engine/state/good";
import { PlayerColor } from "../../engine/state/player";
import { CoordinatesZod } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { DELIVERY_SPACES } from "./state";

const ChangeDeliveryData = z.object({
  coordinates: CoordinatesZod,
  good: GoodZod,
});
type ChangeDeliveryData = z.infer<typeof ChangeDeliveryData>;

export class ChangeDeliveryAction
  implements ActionProcessor<ChangeDeliveryData>
{
  static readonly action = "fac51-change-delivery";
  readonly assertInput = ChangeDeliveryData.parse;
  private readonly grid = injectGrid();
  private readonly gridHelper = inject(GridHelper);
  private readonly log = inject(Log);

  validate(data: ChangeDeliveryData): void {
    assert(DELIVERY_SPACES.includes(data.coordinates), {
      invalidInput: "Choose a delivery space",
    });
    const previous = this.grid().get(data.coordinates)!.getGoods()[0];
    assert(
      DELIVERY_SPACES.filter(
        (coordinates) =>
          this.grid().get(coordinates)!.getGoods()[0] === previous,
      ).length === 2,
      { invalidInput: "Only a duplicated colour may be replaced" },
    );
    assert(allGoods.has(data.good) && data.good !== previous, {
      invalidInput: "Choose a different colour",
    });
  }

  process(data: ChangeDeliveryData): boolean {
    this.gridHelper.update(data.coordinates, (space) => {
      space.goods = [data.good];
    });
    this.log.currentPlayer(
      `changes ${this.grid().displayName(data.coordinates)} to ${goodToString(data.good)}`,
    );
    return true;
  }
}

export class Fac51GoodsGrowthPhase extends GoodsGrowthPhase {
  configureActions(): void {
    this.installAction(ChangeDeliveryAction);
    this.installAction(PassAction);
  }

  onStartTurn(): void {}
  onEndTurn(): void {}

  getPlayerOrder(): PlayerColor[] {
    const player = this.productionPlayer();
    return player == null ? [] : [player.color];
  }

  onEnd(): void {
    const markers = DELIVERY_SPACES.map(
      (coordinates) => this.gridHelper.lookup(coordinates)!.getGoods()[0],
    );
    for (const [index, coordinates] of DELIVERY_SPACES.entries()) {
      this.gridHelper.update(coordinates, (space) => {
        space.goods = [markers[(index + markers.length - 1) % markers.length]];
      });
    }
    this.log.log("Delivery colours rotate one space clockwise");
  }
}
