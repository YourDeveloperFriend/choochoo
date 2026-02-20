import { TexturesProps } from "../view_settings";
import { ReactNode } from "react";
import { coordinatesToCenter } from "../../utils/point";
import { DoubleBaseUsaMapData } from "./grid";

export function DoubleBaseUsaOverlayLayer(props: TexturesProps) {
  const goodSize = props.size / 3;

  const result: ReactNode[] = [];
  for (const [_, space] of props.grid.entries()) {
    const mapData = space.getMapSpecific(DoubleBaseUsaMapData.parse);
    if (mapData && mapData.hasLandGrant === true) {
      const center = coordinatesToCenter(space.coordinates, props.size);
      const x = center.x - goodSize / 2;
      const y = center.y + props.size * 0.2;

      result.push(
        <>
          <polygon
            points={`${x},${y} ${x + goodSize},${y} ${x + goodSize * 1.3},${y + goodSize * 0.3} ${x + goodSize * 1.3},${y + goodSize * 1.3} ${x + goodSize * 0.3},${y + goodSize * 1.3} ${x},${y + goodSize}`}
            strokeWidth={1}
            stroke="black"
            fill="#71ba71"
          />
          <line
            x1={x + goodSize}
            y1={y + goodSize}
            x2={x + goodSize * 1.3}
            y2={y + goodSize * 1.3}
            strokeWidth={1}
            stroke="black"
          />
          <rect
            width={goodSize}
            height={goodSize}
            x={x}
            y={y}
            strokeWidth={1}
            stroke="black"
            fill="#90ee90"
          />
        </>,
      );
    }
  }
  return result;
}
