import { Rotate } from "../../client/components/rotation";
import { coordinatesToCenter, getCorners, polygon } from "../../utils/point";
import { TexturesProps } from "../view_settings";
import { boardCoordinates as c } from "./grid";

/** Artwork only: these price samples are deliberately absent from game state. */
export function HoneybeeCostLegend({ size, rotation }: TexturesProps) {
  return (
    <g pointerEvents="none" aria-label="Track terrain costs">
      {[
        { coordinates: c(1, -2), color: "#f5e1a6", cost: 2 },
        { coordinates: c(1, -2), color: "#d6ac70", cost: 3 },
      ].map(({ coordinates, color, cost }) => {
        const anchor = coordinatesToCenter(coordinates, size);
        // With the map's clockwise rotation, negative x moves up and positive y left.
        const center = {
          x: anchor.x - size * 1.2,
          y: anchor.y + size * (cost === 2 ? 0.3 : -1.6),
        };
        return (
          <g key={cost}>
            <polygon
              points={polygon(getCorners(center, size * 0.72))}
              fill={color}
              stroke="#8b7543"
              strokeWidth={size * 0.025}
            />
            <Rotate rotation={rotation} center={center} reverse>
              <text
                x={center.x}
                y={center.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#66512f"
                fontSize={size * 0.42}
                fontWeight="bold"
              >
                ${cost}
              </text>
            </Rotate>
          </g>
        );
      })}
    </g>
  );
}
