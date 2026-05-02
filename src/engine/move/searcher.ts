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
    const verbose = process.env.MOVE_SEARCH_DEBUG === "true";

    let startTime: number = 0;
    let goodsProcessed: number = 0;
    let totalGoods: number = 0;

    if (verbose) {
      startTime = Date.now();
      goodsProcessed = 0;
      totalGoods = Array.from(this.grid().values()).reduce(
        (sum, space) => sum + space.getGoods().length,
        0,
      );
      console.log(`[MoveSearch] Starting route search for ${totalGoods} goods...`);
    }

    for (const [coordinates, space] of this.grid().entries()) {
      for (const good of space.getGoods()) {
        if (verbose) {
          goodsProcessed++;
          const elapsed = Date.now() - startTime;
          console.log(
            `[MoveSearch] Processing good ${goodsProcessed}/${totalGoods} at ${coordinates} (elapsed: ${elapsed}ms, routes so far: ${allRoutes.length})`
          );
        }

        const partialPath: MoveData = {
          path: [],
          startingCity: coordinates,
          good,
        };
        const routesForGood = this.findAllRoutesForGood(cache, player, partialPath);
        allRoutes.push(...routesForGood);

        if (verbose) {
          const elapsed = Date.now() - startTime;
          console.log(
            `  [OK] Finished good ${goodsProcessed}: found ${routesForGood.length} routes (total: ${allRoutes.length}, elapsed: ${elapsed}ms)`
          );
        }
      }
    }

    if (verbose) {
      const elapsed = Date.now() - startTime;
      console.log(
        `[MoveSearch] Complete! Found ${allRoutes.length} routes in ${elapsed}ms`
      );
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
      this.validator.validatePartialForSearch(player, partialPath),
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
