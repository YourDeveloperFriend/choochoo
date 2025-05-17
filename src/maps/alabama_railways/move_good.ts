import z from "zod";
import { MoveAction, MoveData } from "../../engine/move/move";
import { PlayerColor, PlayerColorZod } from "../../engine/state/player";
import { assert } from "../../utils/validate";

export const AlabamaMoveData = MoveData.extend({
  forgo: PlayerColorZod.optional(),
});
export type AlabamaMoveData = z.infer<typeof AlabamaMoveData>;

export class AlabamaMoveAction extends MoveAction<AlabamaMoveData> {
  assertInput = AlabamaMoveData.parse;

  validate(data: AlabamaMoveData) {
    super.validate(data);

    assert(data.path.find(({ owner }) => data.forgo === owner) != null, {
      invalidInput: "forgo value must be one of the owners",
    });
  }

  calculateIncome(
    action: AlabamaMoveData,
  ): Map<PlayerColor | undefined, number> {
    const map = super.calculateIncome(action);
    map.set(action.forgo, map.get(action.forgo)! - 1);
    return map;
  }
}
