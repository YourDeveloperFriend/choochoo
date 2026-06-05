import { PlayerColor } from "../../engine/state/player";
import { fail } from "../../utils/validate";

export const UN = PlayerColor.GREEN;
export const GREECE = PlayerColor.BLUE;
export const TURKEY = PlayerColor.RED;

export const ALL_COUNTRIES = [UN, GREECE, TURKEY];

export function countryName(country: PlayerColor): string {
  switch (country) {
    case UN:
      return "The UN";
    case GREECE:
      return "Greece";
    case TURKEY:
      return "Turkey";
    default:
      fail(`Unidentified country ${country}`);
  }
}
