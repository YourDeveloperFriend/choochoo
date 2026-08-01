import * as styles from "../../client/grid/hex.module.css";
import { goodStyle } from "../../client/grid/good";
import { Good } from "../../engine/state/good";

export function NwIndianaOverlayLayer() {
  return (
    <>
      <path
        className={`${styles.city} ${goodStyle(Good.RED)}`}
        d="m 1123.6274,958.53885 6.662,11.46115 -7.108,12.26098 63.4926,-0.35935 -6.9932,-11.90163 6.6848,-11.36706 z"
      />
      <path
        className={`${styles.city} ${goodStyle(Good.RED)}`}
        d="m 1213.5646,1028.5119 6.1826,11.4928 14.3309,-0 -31.2241,54.3244 -7.6104,-12.3086 -14.0886,-0.016 z"
      />
    </>
  );
}
