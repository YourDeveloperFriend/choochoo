import { Action } from "../../engine/state/action";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { ImmutableSet } from "../../utils/immutable";
import { MovePhase } from "../../engine/move/phase";
import z from "zod";
import { CoordinatesZod } from "../../utils/coordinates";
import { ActionProcessor } from "../../engine/game/action";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { inject, injectState } from "../../engine/framework/execution_context";
import { assert } from "../../utils/validate";
import { Good } from "../../engine/state/good";
import { GridHelper } from "../../engine/map/grid_helper";
import { Log } from "../../engine/game/log";

export class ChicagoSpeakEasyAllowedActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    return super.getActions().add(Action.BUMP_OFF);
  }
}

export const HAS_USED_BUMP_OFF = new Key("hasUsedBumpOff", {
  parse: z.boolean().parse,
});

export class ChicagoSpeakEasyMovePhase extends MovePhase {
  private readonly hasUsedBumpOff = injectState(HAS_USED_BUMP_OFF);

  configureActions() {
    super.configureActions();
    this.installAction(BumpOffAction);
  }

  onStartTurn() {
    const result = super.onStartTurn();
    this.hasUsedBumpOff.initState(false);
    return result;
  }

  onEndTurn(): void {
    this.hasUsedBumpOff.delete();
    return super.onEndTurn();
  }
}

export const BumpOffData = z.object({
  coordinates: CoordinatesZod,
});

export type BumpOffData = z.infer<typeof BumpOffData>;

export class BumpOffAction implements ActionProcessor<BumpOffData> {
  static readonly action = "bump-off-agent";
  private readonly hasUsedBumpOff = injectState(HAS_USED_BUMP_OFF);
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly gridHelper = inject(GridHelper);
  private readonly log = inject(Log);
  readonly assertInput = BumpOffData.parse;

  validate(data: BumpOffData): void {
    const currentPlayer = this.currentPlayer();
    assert(currentPlayer.selectedAction === Action.BUMP_OFF, {
      invalidInput: "Current player cannot use bump-off action.",
    });
    assert(this.hasUsedBumpOff() === false, {
      invalidInput: "Bump off action has already been used this phase.",
    });
    const target = this.gridHelper.lookup(data.coordinates);
    assert(target !== undefined, { invalidInput: "Invalid coordinates" });
    assert(target.getGoods().indexOf(Good.BLACK) !== -1, {
      invalidInput: "No black good at the requested coordinates.",
    });
  }

  process(data: BumpOffData): boolean {
    const target = this.gridHelper.lookup(data.coordinates);
    assert(target !== undefined, { invalidInput: "Invalid coordinates" });
    this.gridHelper.update(data.coordinates, (loc) => {
      assert(loc.goods !== undefined, {
        invalidInput: "No black good at the requested coordinates.",
      });
      const goodIndex = loc.goods.indexOf(Good.BLACK);
      assert(goodIndex !== -1, {
        invalidInput: "No black good at the requested coordinates.",
      });
      loc.goods.splice(goodIndex, 1);
    });
    this.log.currentPlayer(
      "bumps off an agent at " + this.gridHelper.displayName(data.coordinates),
    );
    this.hasUsedBumpOff.set(true);
    return false;
  }
}
