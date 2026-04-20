import { TexturesProps } from "../view_settings";
import { Grid } from "../../engine/map/grid";
import { NorthernCaliforniaMapData } from "./grid";
import { Direction } from "../../engine/state/tile";
import { City } from "../../engine/map/city";
import { coordinatesToCenter } from "../../utils/point";
import { ReactNode } from "react";
import { FloatingGoodBlock } from "../../client/grid/good_block";

export function NorthernCaliforniaTexturesLayer(props: TexturesProps) {
  const santaCruz = getSantaCruz(props.grid);
  if (!santaCruz) {
    return null;
  }
  const mapSpecific = santaCruz.getMapSpecific(NorthernCaliforniaMapData.parse);
  if (
    !mapSpecific ||
    mapSpecific.shipQueue === undefined ||
    mapSpecific.shipQueue.length === 0
  ) {
    return null;
  }
  const shipQueue = mapSpecific.shipQueue;

  const renderedShipQueue: ReactNode[] = [];
  for (let i = 0; i < shipQueue.length; i++) {
    const center = coordinatesToCenter(
      santaCruz.coordinates.neighbor(Direction.TOP_LEFT),
      props.size,
    );

    const angle = (i * Math.PI) / 9;
    const radius = 1.5 * props.size;
    const x = center.x - radius + radius * Math.cos(angle);
    const y =
      center.y -
      radius * (angle <= Math.PI / 2 ? Math.sin(angle) : 2 - Math.sin(angle));

    renderedShipQueue.push(
      <FloatingGoodBlock
        good={shipQueue[i]}
        center={{ x: x, y: y }}
        size={props.size}
        rotation={props.rotation}
      />,
    );
  }

  return <>{renderedShipQueue}</>;
}

function getSantaCruz(grid: Grid): City | undefined {
  for (const city of grid.cities()) {
    const mapSpecific = city.getMapSpecific(NorthernCaliforniaMapData.parse);
    if (mapSpecific && mapSpecific.shipQueue !== undefined) {
      return city;
    }
  }
  return undefined;
}
