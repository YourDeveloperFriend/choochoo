import { MoveValidator } from "../../engine/move/validator";
import { MoveHelper } from "../../engine/move/helper";
import { MoveData } from "../../engine/move/move";
import { MoveAction } from "../../engine/move/move";
import { Good } from "../../engine/state/good";
import { City } from "../../engine/map/city";
import { inject } from "../../engine/framework/execution_context";
import { InvalidInputError } from "../../utils/error";
import { PlayerData } from "../../engine/state/player";
import { injectGrid } from "../../engine/game/state";
import { Log } from "../../engine/game/log";
import { PlayerHelper } from "../../engine/game/player";

export class SouthernUSMoveHelper extends MoveHelper {
  readonly COASTAL_CITIES = new Set([
    "New Orleans",
    "Mobile",
    "Savannah",
    "Charleston",
  ]);

  isWhiteInCostal(city: City, good: Good): boolean {
    return good === Good.WHITE && this.COASTAL_CITIES.has(city.name());
  }

  canDeliverTo(city: City, good: Good): boolean {
    if (this.isWhiteInCostal(city, good)) {
      return true;
    }

    return super.canDeliverTo(city, good);
  }
}

export class SouthernUSMoveValidator extends MoveValidator {
  protected readonly grid = injectGrid();
  protected readonly moveHelper = inject(SouthernUSMoveHelper);

  validatePartial(player: PlayerData, action: MoveData): void {
    const grid = this.grid();

    for (const step of action.path.slice(0, action.path.length - 1)) {
      const location = grid.get(step.endingStop);

      if (
        location instanceof City &&
        this.moveHelper.isWhiteInCostal(location, action.good)
      ) {
        throw new InvalidInputError(
          `Cannot pass through a costal city with a white good`,
        );
      }
    }
    super.validatePartial(player, action);
  }
}

export class SouthernUSMoveAction extends MoveAction<MoveData> {
  protected readonly log = inject(Log);
  protected readonly playerHelper = inject(PlayerHelper);

  process(action: MoveData): boolean {
    super.process(action);

    if (action.good === Good.WHITE) {
      this.playerHelper.updateCurrentPlayer((player) => {
        player.income++;
      });
      this.log.currentPlayer(
        "received an additional income due to moving white goods",
      );
    }

    return true;
  }

  protected returnToBag(action: MoveData): void {
    if (action.good !== Good.WHITE) {
      super.returnToBag(action);
    }
  }
}
