import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Log } from "../../engine/game/log";
import { injectGrid } from "../../engine/game/state";
import { GridHelper } from "../../engine/map/grid_helper";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { ROUND } from "../../engine/game/round";

export class SouthernUSGoodsGrowthPhase extends GoodsGrowthPhase {
  protected readonly log = inject(Log);
  protected readonly gridHelper = inject(GridHelper);
  protected readonly helper = inject(GoodsHelper);
  private readonly grid = injectGrid();
  private readonly round = injectState(ROUND);

  onEnd(): void {
    if (this.round() <= 4) {
      const good = this.helper.drawGood();
      const atlanta = this.grid().getCityByName("Atlanta");
      this.helper.addGoodToCity(atlanta.coordinates, good);
    }

    super.onEnd();
  }
}
