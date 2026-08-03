import * as styles from "../../client/grid/hex.module.css";
import { goodStyle } from "../../client/grid/good";
import { Good } from "../../engine/state/good";

export function OahuOverlayLayer() {
  return (
    <>
      <path
        className={`${styles.city} ${goodStyle(Good.YELLOW)}`}
        d="M 887.14661 1997.9994 L 880.24991 2010.0003 L 861.9513 2010.0046 L 896.4131 2066.5063 L 904.75077 2052.0011 L 919.69435 2051.9838 L 887.14661 1997.9994 z "
      />
      <path
        className={`${styles.city} ${goodStyle(Good.PURPLE)}`}
        d="M 1211.2048 2358.4725 L 1179.0303 2415.8596 L 1195.2499 2415.851 L 1203.1666 2429.4534 L 1236.1049 2373.147 L 1219.7508 2373.1513 L 1211.2048 2358.4725 z "
      />
    </>
  );
}
