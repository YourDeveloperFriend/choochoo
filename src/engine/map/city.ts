import { Coordinates } from "../../utils/coordinates";
import { CityGroup } from "../state/city_group";
import { Good } from "../state/good";
import { OnRollData } from "../state/roll";
import { CityData } from "../state/space";
import { Direction } from "../state/tile";
import { Space } from "./grid";

export function isCity(s: unknown): s is City {
  return s instanceof City;
}

export class City {
  private readonly goodColorArray: Good[];

  constructor(
    readonly coordinates: Coordinates,
    readonly data: CityData,
  ) {
    this.goodColorArray = Array.isArray(data.color) ? data.color : [data.color];
  }

  isUnpassable(): boolean {
    return false;
  }

  isUrbanized(): boolean {
    return this.data.urbanized ?? false;
  }

  accepts(good: Good): boolean {
    return this.goodColorArray.includes(good);
  }

  goodColors(): Good[] {
    return this.goodColorArray;
  }

  name(): string {
    return this.data.name;
  }

  getGoods(): Good[] {
    return this.data.goods;
  }

  onRoll(): OnRollData[] {
    return this.data.onRoll;
  }

  group(): CityGroup {
    return this.data.onRoll[0]?.group ?? this.data.group ?? CityGroup.WHITE;
  }

  canExit(_: Direction): boolean {
    return true;
  }

  isSameCity(other?: Space): boolean {
    return (
      other instanceof City &&
      (other.coordinates === this.coordinates ||
        (this.data.sameCity != null &&
          this.data.sameCity === other.data.sameCity))
    );
  }

  getMapSpecific<T>(parser: (t: unknown) => T): T | undefined {
    return this.data.mapSpecific != null
      ? parser(this.data.mapSpecific)
      : undefined;
  }
}
