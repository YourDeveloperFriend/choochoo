import { inject, injectState } from "../../engine/framework/execution_context";
import { PlayerHelper, ScoreBreakdownKey } from "../../engine/game/player";
import { injectGrid } from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { MoveHelper } from "../../engine/move/helper";
import { MoveInterceptor } from "../../engine/move/interceptor";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MoveSearcher } from "../../engine/move/searcher";
import { MoveValidator, RouteInfo } from "../../engine/move/validator";
import { allGoods, Good } from "../../engine/state/good";
import { PlayerData } from "../../engine/state/player";
import { Coordinates } from "../../utils/coordinates";
import { InvalidInputError } from "../../utils/error";
import { peek } from "../../utils/functions";
import { assert } from "../../utils/validate";
import {
  DELIVERY_SPACES,
  isDelivery,
  MANIFEST,
  MANIFEST_PENALTIES,
} from "./state";

export class Fac51MoveHelper extends MoveHelper {
  private readonly grid = injectGrid();

  canDeliverTo(city: City, good: Good): boolean {
    return !isDelivery(city) && !city.getGoods().includes(good);
  }

  canMoveThrough(city: City): boolean {
    // Missing colours may be skipped, subject to the Manifest limit in the validator.
    return !isDelivery(city);
  }

  skippedCities(action: MoveData): number {
    return action.path.slice(0, -1).filter((step) => {
      const city = this.grid().get(step.endingStop);
      return city instanceof City && this.canDeliverTo(city, action.good);
    }).length;
  }
}

export class Fac51MoveInterceptor extends MoveInterceptor {
  private readonly helper = inject(Fac51MoveHelper);

  shouldInterceptMove(move: MoveData): boolean {
    return this.helper.skippedCities(move) > 0;
  }
}

export class Fac51MoveValidator extends MoveValidator {
  private readonly manifest = injectState(MANIFEST);
  private readonly facHelper = inject(Fac51MoveHelper);

  validatePartial(player: PlayerData, action: MoveData): void {
    const origin = this.grid().get(action.startingCity);
    assert(origin instanceof City && isDelivery(origin), {
      invalidInput: "Goods must start at a Deliveries space",
    });
    super.validatePartial(player, action);
    assert(
      (this.manifest().get(player.color) ?? 0) +
        this.facHelper.skippedCities(action) <
        MANIFEST_PENALTIES.length,
      { invalidInput: "This delivery exceeds the six-level Manifest chart" },
    );
  }
}

export class Fac51MoveAction extends MoveAction {
  private readonly manifest = injectState(MANIFEST);
  private readonly facHelper = inject(Fac51MoveHelper);

  process(action: MoveData): boolean {
    const skipped = this.facHelper.skippedCities(action);
    const markerGoods = [...this.grid().get(action.startingCity)!.getGoods()];
    // Base processing pays each link's owner. Restore the reusable marker immediately.
    super.process(action);
    this.gridHelper.update(action.startingCity, (space) => {
      space.goods = markerGoods;
    });
    this.manifest.update((levels) => {
      levels.set(
        this.currentPlayer().color,
        (levels.get(this.currentPlayer().color) ?? 0) + skipped,
      );
    });
    if (skipped > 0) {
      this.log.currentPlayer(
        `skips ${skipped} assembly station(s), advancing ${skipped} Manifest level(s)`,
      );
    }
    const destination = peek(action.path).endingStop;
    this.gridHelper.update(destination, (space) => {
      assert(space.goods != null);
      space.goods.push(action.good);
      if ([...allGoods].every((good) => space.goods!.includes(good))) {
        space.goods = [];
        this.log.log(
          `${this.grid().displayName(destination)} completes its assembly and is emptied`,
        );
      }
    });
    return true;
  }

  protected returnToBag(): void {
    // Goods come from the colour supply and remain at the assembly station.
  }
}

export class Fac51PlayerHelper extends PlayerHelper {
  private readonly manifest = injectState(MANIFEST);

  manifestLevel(player: PlayerData): number {
    return this.manifest.getOr(new Map()).get(player.color) ?? 0;
  }

  getScoreBreakdown(player: PlayerData): Map<ScoreBreakdownKey, number> {
    const breakdown = super.getScoreBreakdown(player);
    breakdown.set(
      "Manifest penalty",
      -MANIFEST_PENALTIES[this.manifestLevel(player)],
    );
    return breakdown;
  }
}

export class Fac51MoveSearcher extends MoveSearcher {
  private readonly facValidator = inject(MoveValidator);
  private readonly facGrid = injectGrid();
  private readonly helper = inject(MoveHelper);

  findAllRoutes(player: PlayerData): MoveData[] {
    const results: MoveData[] = [];
    const cache = new Map<Coordinates, RouteInfo[]>();
    const attempt = (fn: () => void): boolean => {
      try {
        fn();
        return true;
      } catch (error) {
        if (error instanceof InvalidInputError) {
          return false;
        }
        throw error;
      }
    };
    const visit = (move: MoveData): void => {
      if (!attempt(() => this.facValidator.validatePartial(player, move))) {
        return;
      }
      if (attempt(() => this.facValidator.validateEnd(move))) {
        results.push(move);
      }
      if (move.path.length >= this.helper.getLocomotive(player)) {
        return;
      }
      const from = move.path.length
        ? peek(move.path).endingStop
        : move.startingCity;
      const routes =
        cache.get(from) ?? this.facValidator.findRoutesFromLocation(from);
      cache.set(from, routes);
      for (const route of routes) {
        visit({
          ...move,
          path: [
            ...move.path,
            { endingStop: route.destination, owner: route.owner },
          ],
        });
      }
    };
    for (const coordinates of DELIVERY_SPACES) {
      for (const good of this.facGrid().get(coordinates)!.getGoods()) {
        visit({ startingCity: coordinates, good, path: [] });
      }
    }
    return results;
  }
}
