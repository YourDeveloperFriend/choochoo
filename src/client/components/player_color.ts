import { PlayerColor } from "../../engine/state/player";
import { assertNever } from "../../utils/validate";
import * as styles from "./player_color.module.css";

export function getPlayerColorCss(playerColor?: PlayerColor): string {
  switch (playerColor) {
    case PlayerColor.BLACK:
      return styles.black;
    case PlayerColor.RED:
      return styles.red;
    case PlayerColor.YELLOW:
      return styles.yellow;
    case PlayerColor.GREEN:
      return styles.green;
    case PlayerColor.PURPLE:
      return styles.purple;
    case PlayerColor.BLUE:
      return styles.blue;
    case PlayerColor.BROWN:
      return styles.brown;
    case PlayerColor.WHITE:
      return styles.white;
    case PlayerColor.PINK:
      return styles.pink;
    case undefined:
      return styles.unowned;
    default:
      assertNever(playerColor);
  }
}
