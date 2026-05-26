import * as styles from "../../client/grid/hex.module.css";
import { TexturesProps } from "../view_settings";
import { CentralNewEnglandMapData } from "./grid";
import { EdgeBoundary } from "../../client/grid/hex";
import React from "react";
import { coordinatesToCenter } from "../../utils/point";

export function CentralNewEnglandTexturesLayer() {
  return (
    <>
      <CentralNewEnglandRivers />
    </>
  );
}

export function CentralNewEnglandOverlayLayer(props: TexturesProps) {
  const edges: React.ReactNode[] = [];
  for (const space of props.grid.values()) {
    const mapSpecific = space.getMapSpecific(CentralNewEnglandMapData.parse);
    if (!mapSpecific) {
      continue;
    }
    if (mapSpecific.stateBorder !== undefined) {
      const center = coordinatesToCenter(space.coordinates, props.size);
      for (const direction of mapSpecific.stateBorder) {
        edges.push(
          <EdgeBoundary
            center={center}
            size={props.size}
            direction={direction}
            color="#3b3b3b"
          />,
        );
      }
    }
  }

  return <>{edges}</>;
}

function CentralNewEnglandRivers() {
  return (
    <>
      <path
        className={styles.riverPath}
        d="m 52.5,1182 c 17.838883,-11.2117 23.654,-37.953 47.76994,-40.3453 25.6891,-2.5484 54.46587,5.9565 67.71582,29.6771 10.54676,18.8813 29.25869,40.9381 53.35981,35.6506 27.66531,-6.0693 40.21642,-34.6992 52.91792,-57.0888 13.86394,-24.4386 44.89347,-39.9666 72.06843,-28.721 6.5536,2.712 14.58983,3.3277 21.16808,-0.1726"
      />
      <path
        className={styles.riverPath}
        d="m -52.5,1485 c 22.118457,-14.2333 23.347186,-61.7313 49.066544,-54.4537 41.67321,11.792 67.725545,-54.0382 98.552876,-59.2332 57.65825,-2.7778 65.09747,59.31 105.74154,77.1291 52.83778,23.165 71.25696,-50.8957 106.98554,-57.2248 39.67144,-7.0276 77.75065,17.9884 109.4736,55.9808 24.95567,29.8877 51.6812,68.3408 97.0334,70.909 55.91093,3.1661 66.20261,-64.297 115.69368,-63.4449 47.53566,0.8184 72.58814,56.9665 115.69368,68.421"
      />
      <path
        className={styles.riverPath}
        d="M -2.0000001e-7,2000.5 C -0.5739324,2024.873 -43.957411,2041.5752 -27.267646,2067.4599 c 26.4582488,41.035 -7.885252,93.031 27.9040458,112.7323 39.6585002,16.3506 67.1339142,12.2224 93.7115692,52.2127 C 108.01552,2254.3256 104.86641,2281.7314 105,2303.5"
      />
      <path
        className={styles.riverPath}
        d="m 157.5,2394.5 c 24.78273,16.3393 48.59049,11.5903 58.38806,35.3272 19.16705,46.4365 -52.14092,92.805 -26.6203,130.9762 21.00875,31.4228 23.36088,-25.5486 42.41416,1.1162"
      />
      <path
        className={styles.riverPath}
        d="m -52.5,2515.5 c 35.398906,18.3434 85.408229,-4.2685 81.288231,54.6854 -1.613053,23.0816 -10.234035,45.0699 -19.46003,64.1854 -6.2853044,11.6706 -46.073146,73.4077 -7.0686121,64.5467 10.6516621,-2.8132 23.0081611,-9.9907 27.8860291,-14.6551"
      />
    </>
  );
}
