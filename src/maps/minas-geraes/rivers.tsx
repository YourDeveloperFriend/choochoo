import * as styles from "../../client/grid/hex.module.css";
import { TexturesProps } from "../view_settings";
import { ReactNode } from "react";
import { coordinatesToCenter } from "../../utils/point";
import { MinasGeraesMapData } from "./grid";
import { Rotate } from "../../client/components/rotation";

export function MinasGeraesOverlayLayer(props: TexturesProps) {
  const result: ReactNode[] = [];
  for (const [_, space] of props.grid.entries()) {
    const mapData = space.getMapSpecific(MinasGeraesMapData.parse);
    if (mapData && mapData.miningTown) {
      const center = coordinatesToCenter(space.coordinates, props.size);
      result.push(
        <circle
          cx={center.x}
          cy={center.y}
          fill="black"
          r={props.size * 0.4}
        />,
      );
    }
    if (
      mapData &&
      mapData.ouroPretoCost !== undefined &&
      mapData.ouroPretoCost !== 0
    ) {
      const center = coordinatesToCenter(space.coordinates, props.size);
      result.push(
        <Rotate rotation={props.rotation} center={center} reverse={true}>
          <text
            fontSize={props.size / 2.5}
            fill="#b63421"
            x={center.x}
            y={center.y + props.size / 20}
            dominantBaseline="middle"
            textAnchor="middle"
          >
            ${mapData.ouroPretoCost}
          </text>
        </Rotate>,
      );
    }
  }
  return result;
}

export function MinasGeraesRivers() {
  return (
    <>
      <path
        className={styles.riverPath}
        d="m 262.5,1303.5 c -30.36048,18.1285 -52.5,33.3684 -52.49998,90.5"
      />
      <path
        className={styles.riverPath}
        d="m 157.50001,1485.5 c -40.60537,22.1558 -80.487063,55.1096 -45.42214,100.864 C 144.32238,1628.4382 105,1652.4744 105,1697"
      />
      <path
        className={styles.riverPath}
        d="m 472.50001,1970.5 c 38.05974,20.75 74.8708,21.6059 119.72617,3.0823 27.56708,-11.3842 53.36424,-39.8473 90.27384,-64.0823"
      />
      <path
        className={styles.riverPath}
        d="m 787.5,1849 c 9.81137,-5.8665 40.18563,-6.4686 48.70645,-30.5 9.9908,-28.1772 43.53805,-22.7225 56.29358,-30"
      />
      <path
        className={styles.riverPath}
        d="m 997.50003,1667 c -31.47508,-21.6703 -54.02637,-54.7432 -64.04024,-88.0544 C 908.44157,1495.7224 975.08165,1455 958.55425,1385.4262 951.98714,1357.7813 943.2183,1330.755 939.98546,1300.5088 937.14832,1273.9647 945,1246.2187 945.00003,1212"
      />
      <path
        className={styles.riverPath}
        d="m 1312.5,1849 c 24.5,13.9727 52.5,-2.3467 62.2075,23.0958 12.5768,32.9627 23.6687,23.6978 42.7925,37.4042"
      />
    </>
  );
}
