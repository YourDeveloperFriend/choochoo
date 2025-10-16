import z from "zod";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { LocoAction } from "../../engine/move/loco";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MovePhase } from "../../engine/move/phase";
import { SpaceType } from "../../engine/state/location_type";
import { PlayerData } from "../../engine/state/player";
import { Coordinates, CoordinatesZod } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { MoveValidator } from "../../engine/move/validator";
import { MovePassAction } from "../../engine/move/pass";
import { EmptyAction } from "../../engine/game/action";
import { UnionPacificExpressMapData } from "./grid";

export const BAILEY_YARD_SAME_CITY = 1;

const UnionPacificExpressMoveState = z.object({
  visitedLocations: CoordinatesZod.array(),
});
type UnionPacificExpressMoveState = z.infer<
  typeof UnionPacificExpressMoveState
>;

export const UNION_PACIFIC_EXPRESS_MOVE_STATE = new Key(
  "unionPacificExpressMoveState",
  {
    parse: UnionPacificExpressMoveState.parse,
  },
);

export class UnionPacificExpressMovePhase extends MovePhase {
  private readonly unionPacificExpressMoveState = injectState(
    UNION_PACIFIC_EXPRESS_MOVE_STATE,
  );
  protected readonly currentPlayer = injectCurrentPlayer();

  onStartTurn() {
    const result = super.onStartTurn();
    this.unionPacificExpressMoveState.initState({
      visitedLocations: [],
    });
    return result;
  }

  onEndTurn(): void {
    this.unionPacificExpressMoveState.delete();
    return super.onEndTurn();
  }
}

export class UnionPacificExpressMovePassAction extends MovePassAction {
  private readonly unionPacificExpressMoveState = injectState(
    UNION_PACIFIC_EXPRESS_MOVE_STATE,
  );

  validate(data: EmptyAction): void {
    super.validate(data);
    assert(this.unionPacificExpressMoveState().visitedLocations.length === 0, {
      invalidInput: "cannot pass when using a transfer station",
    });
  }
}

export class UnionPacificExpressMoveAction extends MoveAction {
  private readonly unionPacificExpressMoveState = injectState(
    UNION_PACIFIC_EXPRESS_MOVE_STATE,
  );

  process(action: MoveData): boolean {
    super.process(action);

    const city = this.grid().get(
      action.path[action.path.length - 1].endingStop,
    );
    assert(city !== undefined);

    const mapSpecific = city.getMapSpecific(UnionPacificExpressMapData.parse);
    if (mapSpecific && mapSpecific.transferStation) {
      this.gridHelper.update(city.coordinates, (city) => {
        assert(city.type === SpaceType.CITY);
        if (city.goods === undefined) {
          city.goods = [];
        }
        city.goods.push(action.good);
      });
      this.unionPacificExpressMoveState.update((val) => {
        // Add starting and intermediate locations to visited locations, but not the ending one (the transfer station)
        val.visitedLocations.push(action.startingCity);
        for (let i = 0; i < action.path.length - 1; i++) {
          val.visitedLocations.push(action.path[i].endingStop);
        }
      });
      return false;
    }

    return true;
  }
}

export class UnionPacificExpressMoveValidator extends MoveValidator {
  private readonly unionPacificExpressMoveState = injectState(
    UNION_PACIFIC_EXPRESS_MOVE_STATE,
  );

  validate(player: PlayerData, action: MoveData) {
    super.validate(player, action);
    const { visitedLocations } = this.unionPacificExpressMoveState();

    const startingCity = this.grid().get(action.startingCity);
    const mapSpecific = startingCity?.getMapSpecific(
      UnionPacificExpressMapData.parse,
    );
    const transferStation =
      mapSpecific !== undefined && !!mapSpecific.transferStation;
    if (visitedLocations.length === 0) {
      assert(!transferStation, {
        invalidInput: `cannot start deliveries from the transfer station`,
      });
    } else {
      assert(transferStation, {
        invalidInput: `must continue chained delivery from the transfer station`,
      });
    }

    this.validateVisitedLocationsNotReused(action, visitedLocations);
  }

  private validateVisitedLocationsNotReused(
    action: MoveData,
    visitedLocations: Coordinates[],
  ) {
    for (const newLoc of [action.startingCity].concat(
      action.path.map((step) => step.endingStop),
    )) {
      assert(!visitedLocations.some((loc) => loc.equals(newLoc)), {
        invalidInput: `cannot revisit a city that was part of a through the transfer station`,
      });
    }
  }
}

export class UnionPacificExpressLocoAction extends LocoAction {
  private readonly unionPacificExpressMoveState = injectState(
    UNION_PACIFIC_EXPRESS_MOVE_STATE,
  );

  validate(): void {
    super.validate();
    assert(this.unionPacificExpressMoveState().visitedLocations.length === 0, {
      invalidInput: "cannot loco in the middle of a delivery chain",
    });
  }
}
