import { assert } from "../../utils/validate";
import { inject, injectState } from "../../engine/framework/execution_context";
import { MovePhase } from "../../engine/move/phase";
import z from "zod";
import { CoordinatesZod } from "../../utils/coordinates";
import { ActionProcessor } from "../../engine/game/action";
import { injectCurrentPlayer, injectGrid } from "../../engine/game/state";
import { GridHelper } from "../../engine/map/grid_helper";
import { Good } from "../../engine/state/good";
import { Log } from "../../engine/game/log";
import { OwnedGold } from "./score";
import { Land } from "../../engine/map/location";

export const MineGoldData = z.object({
  coordinates: CoordinatesZod,
});

export type MineGoldData = z.infer<typeof MineGoldData>;

export class CaliforniaGoldRushMovePhase extends MovePhase {
  configureActions() {
    super.configureActions();
    this.installAction(CaliforniaGoldRushMineAction);
  }
}

export class CaliforniaGoldRushMineAction
  implements ActionProcessor<MineGoldData>
{
  static readonly action = "mine-gold";
  protected readonly grid = injectGrid();
  protected readonly gridHelper = inject(GridHelper);
  protected readonly log = inject(Log);
  protected readonly currentPlayer = injectCurrentPlayer();
  private readonly ownedGold = injectState(OwnedGold);

  readonly assertInput = MineGoldData.parse;
  validate(data: MineGoldData): void {
    const space = this.grid().get(data.coordinates);
    assert(space !== undefined, { invalidInput: "Invalid coordinates" });
    const gold: Good[] = space.getGoods().filter((g) => g === Good.YELLOW);
    assert(gold.length > 0, { invalidInput: "No gold at this location" });
    assert(space instanceof Land);

    const playerColor = this.currentPlayer().color;
    const hasCurrentUserTrack =
      space.getTrack().find((t) => t.getOwner() === playerColor) !== undefined;
    assert(hasCurrentUserTrack, {
      invalidInput: "Can only mine gold on a location where you own track",
    });
  }

  process(data: MineGoldData): boolean {
    this.log.currentPlayer(
      "mines gold at " + this.gridHelper.displayName(data.coordinates),
    );
    this.gridHelper.update(data.coordinates, (space) => {
      assert(space.goods !== undefined);
      const goods = space.goods.slice();
      const index = goods.indexOf(Good.YELLOW);
      assert(index >= 0);
      goods.splice(index, 1);
      space.goods = goods;
    });
    const playerColor = this.currentPlayer().color;
    this.ownedGold.update((map) => {
      map.set(playerColor, map.get(playerColor)! + 1);
    });
    return true;
  }
}
