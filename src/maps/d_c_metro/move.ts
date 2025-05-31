import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { ActionProcessor } from "../../engine/game/action";
import { GridHelper } from "../../engine/map/grid_helper";
import { LocoAction } from "../../engine/move/loco";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MovePhase } from "../../engine/move/phase";
import { MoveValidator } from "../../engine/move/validator";
import { GoodZod } from "../../engine/state/good";
import { PlayerData } from "../../engine/state/player";
import { assert } from "../../utils/validate";

const DC_MOVE = new Key("dcMove", { parse: MoveData.parse });

export class DCLocoAction extends LocoAction {
  private readonly dcMove = injectState(DC_MOVE);

  canEmit(): boolean {
    return !this.dcMove.isInitialized();
  }
}

export class DCMoveValidator extends MoveValidator {
  validatePartial(playerData: PlayerData, moveData: MoveData) {
    super.validatePartial(playerData, moveData);

    assert(
      this.grid().get(moveData.startingCity)!.getGoods().length >=
        moveData.path.length,
      {
        invalidInput: "not enough cubes to support move",
      },
    );
  }
}

export class DCMoveAction extends MoveAction {
  private readonly dcMove = injectState(DC_MOVE);

  canEmit(): boolean {
    return !this.dcMove.isInitialized();
  }

  process(data: MoveData): boolean {
    super.process(data);

    if (data.path.length === 1) {
      return true;
    }
    this.dcMove.initState(data);
    return false;
  }
}

export class DcMovePhase extends MovePhase {
  configureActions(): void {
    super.configureActions();

    this.installAction(DcMoveIntermediateAction);
  }
}

export const DcMoveIntermediateData = z.object({
  goods: GoodZod.array(),
});
export type DcMoveIntermediateData = z.infer<typeof DcMoveIntermediateData>;

export class DcMoveIntermediateAction
  implements ActionProcessor<DcMoveIntermediateData>
{
  static readonly action = "dc-move-intermediate";
  private readonly dcMove = injectState(DC_MOVE);
  private readonly gridHelper = inject(GridHelper);

  readonly assertInput = DcMoveIntermediateData.parse;

  canEmit(): boolean {
    return this.dcMove.isInitialized();
  }

  validate(data: DcMoveIntermediateData): void {
    assert(data.goods.length === this.dcMove().path.length - 1, {
      invalidInput: "must provide the exact amount of goods",
    });
  }

  process(data: DcMoveIntermediateData): boolean {
    for (const [index, good] of data.goods.entries()) {
      this.gridHelper.update(this.dcMove().path[index].endingStop, (space) => {
        space.goods = [...(space.goods ?? []), good];
      });
    }
    return true;
  }
}
