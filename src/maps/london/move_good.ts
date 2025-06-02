import z from "zod";
import { MoveAction, MoveData } from "../../engine/move/move";
import { assert } from "../../utils/validate";
import { inject } from "../../engine/framework/execution_context";
import { SpaceType } from "../../engine/state/location_type";
import { OnRollData } from "../../engine/state/roll";
import { Good, goodToString } from "../../engine/state/good";
import { Random } from "../../engine/game/random";
import { CoordinatesZod } from "../../utils/coordinates";

export const LondonMoveData = MoveData.extend({
  city: CoordinatesZod,
});
export type LondonMoveData = z.infer<typeof LondonMoveData>;

export class LondonMoveAction extends MoveAction<LondonMoveData> {
  private readonly random = inject(Random);

  assertInput = LondonMoveData.parse;

  validate(data: LondonMoveData) {
    super.validate(data);

    const city = this.gridHelper.lookup(data.city);
    assert(city !== undefined, {
      invalidInput: "city must be set and non-empty",
    });

    assert(
      city.coordinates.equals(data.startingCity) ||
        city.coordinates.equals(data.path[data.path.length - 1].endingStop),
      {
        invalidInput: "city must be the starting city or ending city",
      },
    );
  }

  process(action: LondonMoveData): boolean {
    const result = super.process(action);

    const city = this.gridHelper.lookup(action.city);
    assert(city !== undefined);

    const coordinates = city.coordinates;
    this.gridHelper.update(coordinates, (loc) => {
      assert(loc.type === SpaceType.CITY);
      const onRoll: OnRollData[] = loc.onRoll;
      assert(onRoll.length === 1);

      let newGood: Good | undefined | null;
      do {
        newGood = onRoll[0].goods.pop();
      } while (newGood == undefined && onRoll[0].goods.length > 0);

      if (newGood != null) {
        this.log.log(
          `A ${goodToString(newGood)} good is added to ${this.gridHelper.displayName(coordinates)}`,
        );
        loc.goods.push(newGood);
      } else {
        const pull: Good[] | undefined = [];
        this.bag.update((bag) => {
          const pulled = this.random.draw(1, bag, false);
          for (const good of pulled) {
            pull.push(good);
          }
        });
        for (const pulledGood of pull) {
          this.log.log(
            `A ${goodToString(pulledGood)} good is added to the Goods Growth for ${this.gridHelper.displayName(coordinates)}`,
          );
          onRoll[0].goods.push(pulledGood);
        }
      }
    });

    return result;
  }
}
