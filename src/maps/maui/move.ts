import { injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import { City } from "../../engine/map/city";
import { MoveHelper } from "../../engine/move/helper";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MoveValidator } from "../../engine/move/validator";
import { Good } from "../../engine/state/good";
import { PlayerColor, PlayerData } from "../../engine/state/player";
import { peek } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { isHana } from "./goods_growth";

const FOREIGN_LINK_ROUND = 3;
const HANA_BONUS_MIN_LINKS = 5;
const HANA_BONUS_MAX_LINKS = 6;
const HANA_BONUS_INCOME = 2;

/** Hāna accepts the colors of the cubes currently in its hex. */
export class MauiMoveHelper extends MoveHelper {
  canDeliverTo(city: City, good: Good): boolean {
    if (isHana(city)) {
      return city.getGoods().includes(good);
    }
    return super.canDeliverTo(city, good);
  }
}

/** Deliveries of 5 or 6 links to Hāna earn the active player 2 additional income. */
export class MauiMoveAction extends MoveAction {
  calculateIncome(action: MoveData): Map<PlayerColor | undefined, number> {
    const income = super.calculateIncome(action);
    const destination = this.grid().get(peek(action.path).endingStop);
    if (
      destination instanceof City &&
      isHana(destination) &&
      action.path.length >= HANA_BONUS_MIN_LINKS &&
      action.path.length <= HANA_BONUS_MAX_LINKS
    ) {
      const color = this.currentPlayer().color;
      income.set(color, (income.get(color) ?? 0) + HANA_BONUS_INCOME);
    }
    return income;
  }
}

/** Starting on turn 3, every delivery must use at least one link the player does not own. */
export class MauiMoveValidator extends MoveValidator {
  private readonly round = injectState(ROUND);

  validate(player: PlayerData, action: MoveData): void {
    super.validate(player, action);
    if (this.round() < FOREIGN_LINK_ROUND) {
      return;
    }
    assert(
      action.path.some((step) => step.owner !== player.color),
      { invalidInput: "must use at least one link you do not own" },
    );
  }
}
