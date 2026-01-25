import { TexturesProps } from "../view_settings";
import { ReactNode } from "react";
import { coordinatesToCenter, getCorners, polygon } from "../../utils/point";
import { ChicagoLMapData } from "./grid";
import { City } from "../../engine/map/city";

function ChicagoLParkNamesLayer(props: TexturesProps) {
  const result: ReactNode[] = [];
  for (const [_, space] of props.grid.entries()) {
    const mapData = space.getMapSpecific(ChicagoLMapData.parse);
    if (mapData && mapData.parkName) {
      const center = coordinatesToCenter(space.coordinates, props.size);
      const lines = mapData.parkName.split("\n");
      result.push(
        <text
          fontSize={props.size / 4}
          fill="#ffffff"
          x={center.x}
          y={center.y}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {lines.map((line, idx) => (
            <tspan
              key={idx}
              x={center.x}
              dy={idx === 0 ? ((lines.length - 1) / 2) * -1.2 + "em" : "1.2em"}
            >
              {line}
            </tspan>
          ))}
        </text>,
      );
    }
  }
  return result;
}

export function ChicagoLTextures(props: TexturesProps) {
  return (
    <>
      <ChicagoLParkNamesLayer {...props} />
      <path
        stroke="grey"
        strokeWidth={24}
        fill="none"
        d="m -3.9333334e-6,1152 v 121"
      />
      <path
        stroke="grey"
        strokeWidth={24}
        fill="none"
        d="M -3.9333334e-6,1397.6133 V 1818.65 L 101.66049,1886.264 105,1969.9157 765.74379,1972.7756 945,1879.5 997.5,1849"
      />
      <path
        stroke="grey"
        strokeWidth={24}
        fill="none"
        d="M 52.499992,1303.5 210,1212.5 l 106.15203,58.8882 630.60516,364.6356 -2.85988,363.2057 110.10569,58.6277 L 1050,2243"
      />
      <path
        stroke="grey"
        strokeWidth={24}
        fill="none"
        d="m 1050,2364.35 v 242.9999"
      />
      <path stroke="grey" strokeWidth={24} fill="none" d="M 1155,2182 V 1940" />
      <path
        stroke="grey"
        strokeWidth={24}
        fill="none"
        d="m 1155,1819 v -546 l -105,-60.5 V 788"
      />
      <path
        stroke="grey"
        strokeWidth={24}
        fill="none"
        d="M 948.13329,2001.6532 -52.5,2576.5"
      />
      <path
        stroke="grey"
        strokeWidth={24}
        fill="none"
        d="m 314.99998,849 v 424"
      />
    </>
  );
}

export function ChicagoLOverlayLayer(props: TexturesProps): ReactNode {
  let startingCity: City | undefined;
  for (const city of props.grid.cities()) {
    if (
      city.getMapSpecific(ChicagoLMapData.parse)?.governmentStartingCity ===
      true
    ) {
      startingCity = city;
      break;
    }
  }
  if (!startingCity) {
    return null;
  }

  const result: ReactNode[] = [];
  for (const city of props.grid.getSameCities(startingCity)) {
    const center = coordinatesToCenter(city.coordinates, props.size);
    const corners = polygon(getCorners(center, props.size));
    result.push(
      <polygon
        points={corners}
        fill="none"
        stroke="yellow"
        strokeWidth={props.size * 0.15}
      />,
    );
  }
  return result;
}
