import z from "zod";
import { MoveAction, MoveData } from "../../engine/move/move";
import { assert, fail } from "../../utils/validate";
import { inject } from "../../engine/framework/execution_context";
import { City } from "../../engine/map/city";
import { SpaceType } from "../../engine/state/location_type";
import { OnRollData } from "../../engine/state/roll";
import { Good, goodToString } from "../../engine/state/good";
import { Random } from "../../engine/game/random";

export const LondonMoveData = MoveData.extend({
  city: z.string().optional(),
});
export type LondonMoveData = z.infer<typeof LondonMoveData>;

export class LondonMoveAction extends MoveAction<LondonMoveData> {
  private readonly random = inject(Random);

  assertInput = LondonMoveData.parse;

  validate(data: LondonMoveData) {
    super.validate(data);

    assert(!!data.city, {
      invalidInput: "city must be set and non-empty",
    });
  }

  process(action: LondonMoveData): boolean {
    const result = super.process(action);

    let foundCity: City | undefined;
    for (const city of this.gridHelper.findAllCities()) {
      if (city.name() === action.city) {
        foundCity = city;
        break;
      }
    }
    if (!foundCity) {
      fail({
        invalidInput: "city name is invalid",
      });
    }

    this.gridHelper.update(foundCity.coordinates, (loc) => {
      assert(loc.type === SpaceType.CITY);
      const onRoll: OnRollData[] = loc.onRoll;
      assert(onRoll.length === 1);

      let newGood: Good | undefined | null;
      do {
        newGood = onRoll[0].goods.pop();
      } while (newGood == undefined && onRoll[0].goods.length > 0);

      if (newGood != null) {
        this.log.log(`A ${goodToString(newGood)} good is added to ${loc.name}`);
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
            `A ${goodToString(pulledGood)} good is added to the Goods Growth for ${loc.name}`,
          );
          onRoll[0].goods.push(pulledGood);
        }
      }
    });

    return result;
  }
}
