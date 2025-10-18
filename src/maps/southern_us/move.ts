import { MoveHelper } from "../../engine/move/helper";
import { MoveData } from "../../engine/move/move";
import { MoveAction } from "../../engine/move/move";
import { Good } from "../../engine/state/good";
import { City } from "../../engine/map/city";
import { inject } from "../../engine/framework/execution_context";
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
