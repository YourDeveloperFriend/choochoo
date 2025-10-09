import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { LocoAction } from "../../engine/move/loco";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MovePhase } from "../../engine/move/phase";
import { SpaceType } from "../../engine/state/location_type";
import { PlayerColorZod, PlayerData } from "../../engine/state/player";
import { CoordinatesZod } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { Random } from "../../engine/game/random";
import { PlayerHelper } from "../../engine/game/player";
import { MoveValidator } from "../../engine/move/validator";
import { MovePassAction } from "../../engine/move/pass";
import { EmptyAction } from "../../engine/game/action";
import { UnionPacificExpressMapData } from "./grid";

export const BAILEY_YARD_SAME_CITY = 1;

const UsedLink = z.object({
  start: CoordinatesZod,
  end: CoordinatesZod,
  owner: PlayerColorZod.optional(),
});
type UsedLink = z.infer<typeof UsedLink>;

const UnionPacificExpressMoveState = z.object({
  usedLinks: UsedLink.array(),
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
      usedLinks: [],
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
    assert(this.unionPacificExpressMoveState().usedLinks.length === 0, {
      invalidInput: "cannot pass when using a transfer station",
    });
  }
}

export class UnionPacificExpressMoveAction extends MoveAction {
  private readonly unionPacificExpressMoveState = injectState(
    UNION_PACIFIC_EXPRESS_MOVE_STATE,
  );
  private readonly random = inject(Random);
  private readonly playerHelper = inject(PlayerHelper);

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
        let start = action.startingCity;
        for (const path of action.path) {
          val.usedLinks.push({
            start: start,
            end: path.endingStop,
            owner: path.owner,
          });
          start = path.endingStop;
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
    const { usedLinks } = this.unionPacificExpressMoveState();

    const startingCity = this.grid().get(action.startingCity);
    const mapSpecific = startingCity?.getMapSpecific(
      UnionPacificExpressMapData.parse,
    );
    const transferStation =
      mapSpecific !== undefined && !!mapSpecific.transferStation;
    if (usedLinks.length === 0) {
      assert(!transferStation, {
        invalidInput: `cannot start deliveries from the transfer station`,
      });
    } else {
      assert(transferStation, {
        invalidInput: `must continue chained delivery from the transfer station`,
      });
    }

    this.validateUsedLinksNotReused(player, action, usedLinks);
  }

  private validateUsedLinksNotReused(
    player: PlayerData,
    action: MoveData,
    usedLinks: UsedLink[],
  ) {
    let fromCity = action.startingCity;
    for (const step of action.path) {
      const routes = [
        ...this.findRoutesToLocation(player, fromCity, step.endingStop),
      ];

      const matchingRoutesCount = routes.filter(
        (r) => r.owner === step.owner,
      ).length;
      const usedRoutesCount = usedLinks.filter((link: UsedLink) => {
        return (
          link.owner === step.owner &&
          ((link.start.equals(fromCity) && link.end.equals(step.endingStop)) ||
            (link.end.equals(fromCity) && link.start.equals(step.endingStop)))
        );
      }).length;
      assert(matchingRoutesCount > usedRoutesCount, {
        invalidInput: `cannot re-use the route between ${this.grid().displayName(fromCity)} and ${this.grid().displayName(step.endingStop)} on this chain`,
      });
      fromCity = step.endingStop;
    }
  }
}

export class UnionPacificExpressLocoAction extends LocoAction {
  private readonly unionPacificExpressMoveState = injectState(
    UNION_PACIFIC_EXPRESS_MOVE_STATE,
  );

  validate(): void {
    super.validate();
    assert(this.unionPacificExpressMoveState().usedLinks.length === 0, {
      invalidInput: "cannot loco in the middle of a delivery chain",
    });
  }
}
