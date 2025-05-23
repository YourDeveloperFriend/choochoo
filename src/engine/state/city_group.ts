import { assertNever } from "../../utils/validate";
import { OnRollData } from "./roll";

export enum CityGroup {
  WHITE = 1,
  BLACK,
}

export const WHITE = CityGroup.WHITE;
export const BLACK = CityGroup.BLACK;

export function cityGroupToString(group: CityGroup) {
  switch (group) {
    case CityGroup.WHITE:
      return "White";
    case CityGroup.BLACK:
      return "Black";
    default:
      assertNever(group);
  }
}

export function toLetter({ group, onRoll }: OnRollData): string {
  if (group === CityGroup.WHITE) {
    return String.fromCharCode("A".charCodeAt(0) + onRoll - 3);
  }
  return String.fromCharCode("E".charCodeAt(0) + onRoll - 1);
}
