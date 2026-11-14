import { DOMINANT_WORKER_BEE } from "./actions";
import { inject } from "../../engine/framework/execution_context";
import { MoneyManager } from "../../engine/game/money_manager";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MoveValidator, RouteInfo } from "../../engine/move/validator";
import { MoveInterceptor } from "../../engine/move/interceptor";
import { Good } from "../../engine/state/good";
import { PlayerData } from "../../engine/state/player";
import { OwnedInterCityConnection } from "../../engine/state/inter_city_connection";
import { assert } from "../../utils/validate";

export function beeFee(grid: Grid, player: PlayerData, move: MoveData): number {
  if (player.selectedAction === DOMINANT_WORKER_BEE) {
    return 0;
  }
  const visited: City[] = [];
  let fee = 0;
  for (const step of move.path) {
    const city = grid.get(step.endingStop);
    if (
      !(city instanceof City) ||
      visited.some((other) => city.isSameCity(other))
    ) {
      continue;
    }
    visited.push(city);
    fee += grid
      .getSameCities(city)
      .reduce(
        (sum, half) =>
          sum + half.getGoods().filter((good) => good === Good.YELLOW).length,
        0,
      );
  }
  return fee;
}

export class HoneybeeMoveValidator extends MoveValidator {
  validatePartial(player: PlayerData, data: MoveData): void {
    super.validatePartial(player, data);
    assert(data.good !== Good.YELLOW, {
      invalidInput: "Bee swarms are relocated with Waggle Dance, not delivered",
    });
    assert(player.money >= beeFee(this.grid(), player, data), {
      invalidInput: "Cannot afford the bee swarm fees on this route",
    });
  }

  protected getAdditionalRoutesFromCity(origin: City): RouteInfo[] {
    // Base route lookup includes track from both halves but printed links only from the clicked half.
    const grid = this.grid();
    const otherHalves = grid
      .getSameCities(origin)
      .filter((half) => !half.coordinates.equals(origin.coordinates));
    return grid.connections
      .filter(
        (connection) =>
          connection.owner != null &&
          otherHalves.some((half) =>
            connection.connects.includes(half.coordinates),
          ),
      )
      .map((connection) => {
        const otherEnd = connection.connects.find(
          (coordinates) =>
            !grid
              .getSameCities(origin)
              .some((half) => half.coordinates.equals(coordinates)),
        )!;
        return {
          type: "connection" as const,
          destination: otherEnd,
          connection: connection as OwnedInterCityConnection,
          owner: connection.owner!.color,
        };
      });
  }
}

export class HoneybeeMoveAction extends MoveAction {
  private readonly money = inject(MoneyManager);
  process(data: MoveData): boolean {
    const fee = beeFee(this.grid(), this.currentPlayer(), data);
    if (fee > 0) {
      this.money.addMoneyForCurrentPlayer(-fee);
      this.log.currentPlayer(`pays $${fee} in bee swarm fees`);
    }
    return super.process(data);
  }
}

export class HoneybeeMoveInterceptor extends MoveInterceptor {
  shouldInterceptMove(): boolean {
    return true;
  }
}
