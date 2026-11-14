import { Good } from "../../engine/state/good";
import { GoodsTableVisual } from "../view_settings";
import { BeeCube } from "./bee_cube";
import * as styles from "./goods_table.module.css";

export function honeybeeGoodsTableVisual(
  good: Good,
): GoodsTableVisual | undefined {
  if (good !== Good.YELLOW) {
    return undefined;
  }
  return {
    className: styles.beeGood,
    content: (
      <svg className={styles.beeIcon} viewBox="-4 -4 138 138">
        <BeeCube x={0} y={0} size={100} strokeWidth={4} />
      </svg>
    ),
  };
}
