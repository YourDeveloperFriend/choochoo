import { GameStarter } from "../../engine/game/starter";
import { assert } from "../../utils/validate";
import { SpaceType } from "../../engine/state/location_type";
import { Good } from "../../engine/state/good";
import { CityGroup } from "../../engine/state/city_group";
import { OnRoll } from "../../engine/state/roll";
import { GridData } from "../../engine/state/grid";

export class ChicagoSpeakEasyStarter extends GameStarter {
  drawCubesForCities(startingMap: GridData, playerCount: number) {
    super.drawCubesForCities(startingMap, playerCount);

    const bag = [...this.bag()];
    for (const cityGroup of [CityGroup.WHITE, CityGroup.BLACK]) {
      const rolledDice: number[] = [];
      while (rolledDice.length < 3) {
        let nextDie = this.random.rollDie();
        // Avoid allowing the black 5/6 city from getting black cubes
        if (cityGroup === CityGroup.BLACK && nextDie === 6) {
          nextDie = 5;
        }
        if (rolledDice.indexOf(nextDie) === -1) {
          rolledDice.push(nextDie);
        }
      }
      for (const [coordinates, location] of startingMap.entries()) {
        if (location.type === SpaceType.CITY) {
          this.gridHelper.update(coordinates, (loc) => {
            assert(loc.type === SpaceType.CITY);
            if (
              loc.onRoll.some(
                (onRoll) =>
                  onRoll.group === cityGroup &&
                  rolledDice.indexOf(onRoll.onRoll) !== -1,
              )
            ) {
              loc.goods.push(Good.BLACK);
            }
          });
        }
      }
    }

    for (const [coordinates, location] of startingMap.entries()) {
      if (
        location.type === SpaceType.CITY &&
        location.color !== Good.BLACK &&
        (!Array.isArray(location.color) ||
          location.color.indexOf(Good.BLACK) === -1)
      ) {
        this.gridHelper.update(coordinates, (loc) => {
          assert(loc.type === SpaceType.CITY);
          if (loc.goods === undefined) {
            loc.goods = [];
          }
          while (loc.goods.length < 3) {
            const good = bag.pop();
            assert(good !== undefined);
            loc.goods.push(good);
          }
        });
      }
    }
    this.bag.set(bag);
  }

  protected startingBag(): Good[] {
    return super.startingBag().filter((g) => g !== Good.BLACK);
  }

  getAvailableCities(): Array<[Good | Good[], CityGroup, OnRoll]> {
    return super.getAvailableCities().filter((city) => city[0] !== Good.BLACK);
  }
}
