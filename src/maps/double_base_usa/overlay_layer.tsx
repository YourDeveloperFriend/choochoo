import { TexturesProps } from "../view_settings";
import { ReactNode } from "react";
import { coordinatesToCenter } from "../../utils/point";
import { DoubleBaseUsaMapData } from "./grid";

export function DoubleBaseUsaOverlayLayer(props: TexturesProps) {
  const result: ReactNode[] = [];
  for (const [_, space] of props.grid.entries()) {
    const mapData = space.getMapSpecific(DoubleBaseUsaMapData.parse);
    if (mapData && mapData.hasLandGrant === true) {
      const center = coordinatesToCenter(space.coordinates, props.size);

      result.push(
        <rect
          filter={`url(#cubeShadow)`}
          width={props.size / 3}
          height={props.size / 3}
          x={center.x - props.size / 6}
          y={center.y + props.size * 0.2}
          fill="#90ee90"
          strokeWidth={1}
          stroke="black"
        />,
      );
    }
  }
  return result;
}
