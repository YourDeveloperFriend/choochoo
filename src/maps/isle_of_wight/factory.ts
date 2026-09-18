import { z } from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { ActionProcessor } from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { BAG, injectCurrentPlayer, injectGrid } from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { GridHelper } from "../../engine/map/grid_helper";
import { Good, goodToString } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { allDirections } from "../../engine/state/tile";
import { PlayerColor } from "../../engine/state/player";
import { Coordinates, CoordinatesZod } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { describeTrain } from "./train_data";
import { TrainHelper } from "./trains";

export const WorkInFactoriesData = z.object({
  trainIndex: z.number().min(0),
  coordinates: CoordinatesZod,
});
export type WorkInFactoriesData = z.infer<typeof WorkInFactoriesData>;

/**
 * "Work in the factories": instead of a delivery, a player exhausts an unused
 * train -- even one with no open boxes left -- and adds a cube of the matching
 * color to a city they are connected to.
 */
export class WorkInFactoriesAction
  implements ActionProcessor<WorkInFactoriesData>
{
  static readonly action = "workInFactories";
  readonly assertInput = WorkInFactoriesData.parse;

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly grid = injectGrid();
  private readonly gridHelper = inject(GridHelper);
  private readonly trainHelper = inject(TrainHelper);
  private readonly bag = injectState(BAG);
  private readonly log = inject(Log);

  canEmit(): boolean {
    return this.trainHelper.unusedTrains(this.currentPlayer().color).length > 0;
  }

  validate({ trainIndex, coordinates }: WorkInFactoriesData): void {
    const player = this.currentPlayer();
    const card = this.trainHelper.trainsFor(player.color)[trainIndex];
    assert(card != null, {
      invalidInput: `no train at position ${trainIndex + 1}`,
    });
    assert(!card.used, {
      invalidInput: "that train's crew is already on a break this turn",
    });

    const city = this.grid().get(coordinates);
    assert(city instanceof City, {
      invalidInput: "must select a city",
    });
    assert(this.isConnected(player.color, coordinates), {
      invalidInput: "you are not connected to that city",
    });
  }

  process({ trainIndex, coordinates }: WorkInFactoriesData): boolean {
    const player = this.currentPlayer();
    const city = this.grid().get(coordinates) as City;
    const card = this.trainHelper.trainsFor(player.color)[trainIndex];

    this.trainHelper.useTrain(player.color, trainIndex);
    this.log.currentPlayer(
      `sends the crew of their ${describeTrain(card)} to work in the factories`,
    );

    const good = this.drawMatchingGood(city.goodColors());
    if (good == null) {
      this.log.currentPlayer(
        `finds no matching good in the bag for ${city.name()}`,
      );
      return true;
    }
    this.gridHelper.update(coordinates, (space) => {
      assert(space.type === SpaceType.CITY);
      space.goods.push(good);
    });
    this.log.currentPlayer(
      `places a ${goodToString(good)} good in ${city.name()}`,
    );
    return true;
  }

  /** Searches the bag for a cube matching one of the city's colours. */
  private drawMatchingGood(colors: Good[]): Good | undefined {
    let found: Good | undefined;
    this.bag.update((bag) => {
      for (const color of colors) {
        const index = bag.indexOf(color);
        if (index === -1) continue;
        found = color;
        bag.splice(index, 1);
        return;
      }
    });
    return found;
  }

  /** Whether the player has track, complete or dangling, touching the city. */
  private isConnected(color: PlayerColor, coordinates: Coordinates): boolean {
    const grid = this.grid();
    const city = grid.get(coordinates);
    if (!(city instanceof City)) return false;
    const cities = [city, ...grid.getSameCities(city)];
    return cities.some((one) =>
      allDirections.some((direction) => {
        const track = grid.getTrackConnection(one.coordinates, direction);
        if (track == null) return false;
        return grid.getRoute(track).some((piece) => piece.getOwner() === color);
      }),
    );
  }
}
