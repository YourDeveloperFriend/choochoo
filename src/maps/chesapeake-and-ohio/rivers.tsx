import * as styles from "../../client/grid/hex.module.css";
import * as factoryStyles from "./rivers.module.css";
import { TexturesProps } from "../view_settings";
import { ReactNode } from "react";
import { coordinatesToCenter } from "../../utils/point";
import { ChesapeakeAndOhioMapData } from "./build";
import { getPlayerColorCss } from "../../client/components/player_color";

export function ChesapeakeAndOhioOverlayLayer(props: TexturesProps) {
  const result: ReactNode[] = [];
  for (const city of props.grid.cities()) {
    const mapData = city.getMapSpecific(ChesapeakeAndOhioMapData.parse);
    if (mapData && mapData.factoryColor !== undefined) {
      const center = coordinatesToCenter(city.coordinates, props.size);
      result.push(
        <circle
          className={`${factoryStyles.factory} ${getPlayerColorCss(mapData.factoryColor)}`}
          cx={center.x}
          cy={center.y}
          r={props.size * 0.4}
        />,
      );
    }
  }
  return result;
}

export function ChesapeakeAndOhioRivers() {
  return (
    <>
      <path
        className={styles.riverPath}
        d="m -52.500002,1485.5 c 68.001214,-25.6089 200.536682,-103.5086 253.457712,-149.8123 67.84517,-59.3618 149.49615,-117.4084 219.17486,-116.7975 72.4243,0.635 157.42277,127.6747 207.90115,115.9875 C 710.72525,1315.7322 844.92076,1231.1698 839.99998,1152"
      />
      <path
        className={styles.riverPath}
        d="m -52.500002,2031 c 85.620757,50.6592 184.389172,-31.2831 263.208492,-89.0167 32.67988,-23.9374 58.43678,-57.1917 94.70263,-74.1746 29.15963,-13.6552 75.91092,-23.3398 111.66626,-48.6895 42.5297,-30.1525 84.41161,-57.0387 109.32432,-57.7702 40.71641,-1.1956 80.04792,32.9571 96.15304,58.9146 22.77779,36.7121 -4.74686,82.1405 9.44856,128.9451 19.05625,62.8316 171.75866,37.8216 207.31261,115.0502 17.48633,37.983 13.19098,89.8935 1.49359,135.5702 -12.83153,50.1054 -32.53599,93.1615 6.28759,112.8714 78.63023,39.9188 93.21671,66.6577 97.90288,112.2995"
      />
      <path
        className={styles.riverPath}
        d="m 1470,1273 c 0.632,33.8233 9.2839,65.9872 52.5,91"
      />
      <path
        className={styles.riverPath}
        d="m 1207.5,1303.5 c 61.3868,24.206 116.6155,53.5995 155.7425,89.9846 68.016,63.2495 110.4492,81.5051 159.2575,92.0154"
      />
      <path
        className={styles.riverPath}
        d="m 1257.2759,1572.3777 c 35.2281,43.1002 68.8375,57.0144 98.9329,56.7949 42.463,-0.3098 63.0584,-17.9728 81.4011,-32.4216 23.4863,-18.5007 76.0713,-23.9507 100.555,3.4824 29.0831,32.5867 57.4683,45.2481 89.335,66.7666"
      />
    </>
  );
}
