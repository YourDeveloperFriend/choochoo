import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { MoveHelper } from "../../engine/move/helper";
import { LocoAction } from "../../engine/move/loco";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MovePhase } from "../../engine/move/phase";
import { SpaceType } from "../../engine/state/location_type";
import { PlayerData } from "../../engine/state/player";
import { CoordinatesZod } from "../../utils/coordinates";
import { peek } from "../../utils/functions";
import { assert } from "../../utils/validate";

export const DiscoMoveState = z.object({
  movesRemaining: z.number(),
  lastStop: CoordinatesZod.optional(),
});
export type DiscoMoveState = z.infer<typeof DiscoMoveState>;

const DISCO_MOVE_STATE = new Key("discoMoveState", {
  parse: DiscoMoveState.parse,
});

export class DiscoMovePhase extends MovePhase {
  private readonly moveHelper = inject(MoveHelper);
  private readonly discoMoveState = injectState(DISCO_MOVE_STATE);
  protected readonly currentPlayer = injectCurrentPlayer();

  onStartTurn() {
    const result = super.onStartTurn();
    this.discoMoveState.initState({
      movesRemaining: this.moveHelper.getLocomotive(this.currentPlayer()),
    });
    return result;
  }

  onEndTurn(): void {
    this.discoMoveState.delete();
    return super.onEndTurn();
  }
}

export class DiscoMoveHelper extends MoveHelper {
  private readonly discoMoveState = injectState(DISCO_MOVE_STATE);

  isWithinLocomotive(_: PlayerData, moveData: MoveData): boolean {
    return moveData.path.length <= this.discoMoveState().movesRemaining;
  }
}

export class DiscoMoveAction extends MoveAction {
  private readonly discoMoveState = injectState(DISCO_MOVE_STATE);

  validate(action: MoveData): void {
    super.validate(action);
    const { lastStop } = this.discoMoveState();
    if (lastStop != null) {
      assert(lastStop === action.startingCity, {
        invalidInput: `must start chain reaction move from ${this.grid().displayName(lastStop)}`,
      });
    }
  }

  process(action: MoveData): boolean {
    super.process(action);
    const city = this.grid().get(action.startingCity);
    assert(city instanceof City);
    if (city.getGoods().length === 0) {
      this.log.log(
        `${this.grid().displayName(action.startingCity)} burns to the ground!`,
      );
      this.gridHelper.update(action.startingCity, (city) => {
        assert(city.type === SpaceType.CITY);
        city.color = [];
      });
    }

    this.discoMoveState.update((val) => {
      val.movesRemaining -= action.path.length;
      val.lastStop = peek(action.path).endingStop;
    });

    return this.discoMoveState().movesRemaining === 0;
  }
}

export class DiscoLoco extends LocoAction {
  private readonly discoMoveState = injectState(DISCO_MOVE_STATE);

  validate(): void {
    super.validate();
    assert(this.discoMoveState().lastStop == null, {
      invalidInput: "cannot loco in the middle of chain reaction",
    });
  }
}
