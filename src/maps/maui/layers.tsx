import { Rotate } from "../../client/components/rotation";
import { coordinatesToCenter } from "../../utils/point";
import { Land } from "../../engine/map/location";
import { TexturesProps } from "../view_settings";
import { MauiLandData } from "./map_data";

/** Draws the "straight/curve" price on the variable-price hexes until track is built on them. */
export function MauiOverlayLayer({ grid, size, rotation }: TexturesProps) {
  const labels = [];
  for (const [_, space] of grid.entries()) {
    if (!(space instanceof Land) || space.hasTile()) {
      continue;
    }
    const cost = space.getMapSpecific(MauiLandData.parse)?.fixedTileCost;
    if (cost == null) {
      continue;
    }
    const center = coordinatesToCenter(space.coordinates, size);
    labels.push(
      <Rotate
        key={space.coordinates.serialize()}
        rotation={rotation}
        center={center}
        reverse={true}
      >
        <text
          fontSize={size / 2.8}
          fill="#b63421"
          x={center.x}
          y={center.y + size / 20}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          ${cost.straight}/${cost.curve}
        </text>
      </Rotate>,
    );
  }
  return <>{labels}</>;
}
