import { Good } from "../../engine/state/good";
import { assertNever } from "../../utils/validate";
import * as styles from "./good.module.css";

export function goodStyle(good: Good): string {
  switch (good) {
    case Good.BLACK:
      return styles.black;
    case Good.BLUE:
      return styles.blue;
    case Good.PURPLE:
      return styles.purple;
    case Good.RED:
      return styles.red;
    case Good.YELLOW:
      return styles.yellow;
    case Good.WHITE:
      return styles.white;
    default:
      assertNever(good);
  }
}
