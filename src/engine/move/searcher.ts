import { Coordinates } from "../../utils/coordinates";
import { InvalidInputError } from "../../utils/error";
import { peek } from "../../utils/functions";
import { inject } from "../framework/execution_context";
import { injectGrid } from "../game/state";
import { PlayerData } from "../state/player";
import { MoveData } from "./move";
import { MoveValidator, RouteInfo } from "./validator";

export class MoveSearcher {
  private readonly grid = injectGrid();
  private readonly validator = inject(MoveValidator);

  findAllRoutes(player: PlayerData): MoveData[] {
    const allRoutes: MoveData[] = [];
    const cache = new Map<Coordinates, RouteInfo[]>();
    for (const [coordinates, space] of this.grid().entries()) {
      for (const good of space.getGoods()) {
        const partialPath: MoveData = {
          path: [],
          startingCity: coordinates,
          good,
        };
        allRoutes.push(
          ...this.findAllRoutesForGood(cache, player, partialPath),
        );
      }
    }
    return allRoutes;
  }

  private findAllRoutesForGood(
    cache: Map<Coordinates, RouteInfo[]>,
    player: PlayerData,
    partialPath: MoveData,
  ): MoveData[] {
    const endErrorMessage = this.getErrorMessage(() =>
      this.validator.validateEnd(partialPath),
    );

    const partialErrorMessage = this.getErrorMessage(() =>
      this.validator.validatePartial(player, partialPath),
    );

    if (endErrorMessage == null && partialErrorMessage == null) {
      return [partialPath];
    }

    if (partialErrorMessage != null) {
      return [];
    }

    const fromCoordinates =
      partialPath.path.length > 0
        ? peek(partialPath.path).endingStop
        : partialPath.startingCity;
    const routes =
      cache.get(fromCoordinates) ||
      this.validator.findRoutesFromLocation(fromCoordinates);
    cache.set(fromCoordinates, routes);
    return routes.flatMap((route) => {
      const newPath: MoveData = {
        ...partialPath,
        path: partialPath.path.concat([
          {
            endingStop: route.destination,
            owner: route.owner,
          },
        ]),
      };
      return this.findAllRoutesForGood(cache, player, newPath);
    });
  }

  private getErrorMessage(fn: () => void): string | undefined {
    try {
      fn();
    } catch (e) {
      if (e instanceof InvalidInputError) {
        return e.message;
      }
      throw e;
    }
    return undefined;
  }
}
