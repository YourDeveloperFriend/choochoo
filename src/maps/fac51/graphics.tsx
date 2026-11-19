import { useId } from "react";
import { Rotate } from "../../client/components/rotation";
import * as gridStyles from "../../client/grid/hex_grid.module.css";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { Land } from "../../engine/map/location";
import { Rotation } from "../../engine/game/map_settings";
import {
  coordinatesToCenter,
  getCorners,
  Point,
  polygon,
} from "../../utils/point";
import {
  CityVisualProps,
  TexturesProps,
  TownVisualProps,
} from "../view_settings";
import { DELIVERY_SPACES, isDelivery } from "./state";

const YELLOW = "#ffe51b";
const INK = "#242825";
export const FACTORY_FLOOR = "#77746e";

function HazardPattern({
  id,
  size,
  transform = "rotate(40)",
}: {
  id: string;
  size: number;
  transform?: string;
}) {
  return (
    <pattern
      id={id}
      width={size * 0.23}
      height={size * 0.23}
      patternUnits="userSpaceOnUse"
      patternTransform={transform}
    >
      <rect width={size * 0.23} height={size * 0.23} fill={YELLOW} />
      <rect width={size * 0.115} height={size * 0.23} fill={INK} />
    </pattern>
  );
}

export function Fac51City({
  city,
  center,
  size,
  rotation,
  highlighted,
  clickable,
}: CityVisualProps) {
  const hazardId = `fac51-city-${useId().replace(/:/g, "")}`;
  const delivery = isDelivery(city);
  const outerCorners = getCorners(center, size * 0.975);
  const innerCorners = getCorners(center, size * 0.86);
  const edges = outerCorners.map((start, index) => {
    const next = (index + 1) % 6;
    const end = outerCorners[next];
    const angle =
      (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
    return {
      points: polygon([start, end, innerCorners[next], innerCorners[index]]),
      transform: `translate(${start.x} ${start.y}) rotate(${angle + 40})`,
    };
  });
  return (
    <g>
      <defs>
        {edges.map((edge, index) => (
          <HazardPattern
            key={index}
            id={`${hazardId}-${index}`}
            size={size}
            transform={edge.transform}
          />
        ))}
      </defs>
      <polygon
        points={polygon(getCorners(center, size * 0.99))}
        fill={INK}
        className={clickable ? gridStyles.clickable : undefined}
        data-coordinates={city.coordinates.serialize()}
        stroke={highlighted ? "#fff" : INK}
        strokeWidth={size * (highlighted ? 0.07 : 0.025)}
        strokeLinejoin="round"
      />
      <g pointerEvents="none">
        {edges.map((edge, index) => (
          <polygon
            key={index}
            points={edge.points}
            fill={`url(#${hazardId}-${index})`}
          />
        ))}
      </g>
      <polygon
        points={polygon(getCorners(center, size * 0.86))}
        fill={delivery ? INK : "#faf8ee"}
        pointerEvents="none"
      />
      <Rotate rotation={rotation} center={center} reverse>
        <text
          x={center.x}
          y={center.y + size * 0.48}
          fill={delivery ? YELLOW : INK}
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize={size * (delivery ? 0.17 : 0.19)}
          fontWeight="700"
          letterSpacing={size * 0.008}
          pointerEvents="none"
        >
          {city.name().toUpperCase()}
        </text>
        {delivery && (
          <text
            x={center.x}
            y={center.y + size * 0.66}
            fill="#e3e0cb"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize={size * 0.1}
            letterSpacing={size * 0.018}
            pointerEvents="none"
          >
            CUBE SUPPLY
          </text>
        )}
      </Rotate>
    </g>
  );
}

export function Fac51Town({ town, center, size, rotation }: TownVisualProps) {
  const built = town.hasTile();
  const angle = ((town.coordinates.q + town.coordinates.r) % 3) * 45 - 45;
  return (
    <g pointerEvents="none">
      <circle
        cx={center.x}
        cy={center.y}
        r={size * (built ? 0.27 : 0.29)}
        fill="#f7f4e7"
        stroke={INK}
        strokeWidth={size * 0.025}
      />
      {!built && (
        <Rotate rotation={rotation} center={center} reverse>
          <g transform={`translate(${center.x} ${center.y}) rotate(${angle})`}>
            <g fill="#303833">
              {[-1, 1].map((side) => (
                <g key={side}>
                  <rect
                    x={-size * 0.29}
                    y={side * size * 0.14 - size * 0.045}
                    width={size * 0.13}
                    height={size * 0.09}
                    rx={size * 0.02}
                  />
                  <rect
                    x={size * 0.13}
                    y={side * size * 0.14 - size * 0.045}
                    width={size * 0.13}
                    height={size * 0.09}
                    rx={size * 0.02}
                  />
                </g>
              ))}
            </g>
            <rect
              x={-size * 0.33}
              y={-size * 0.13}
              width={size * 0.64}
              height={size * 0.26}
              rx={size * 0.08}
              fill={YELLOW}
              stroke="#a68e14"
              strokeWidth={size * 0.018}
            />
            <rect
              x={-size * 0.27}
              y={-size * 0.085}
              width={size * 0.14}
              height={size * 0.17}
              rx={size * 0.025}
              fill="#404a43"
            />
            <rect
              x={-size * 0.07}
              y={-size * 0.055}
              width={size * 0.6}
              height={size * 0.11}
              rx={size * 0.025}
              fill="#e8c915"
              stroke="#88770f"
              strokeWidth={size * 0.018}
            />
            <circle r={size * 0.075} fill="#a99735" />
            <path
              d={`M ${size * 0.5} 0 v ${size * 0.17} q 0 ${size * 0.08} ${-size * 0.07} ${size * 0.08}`}
              stroke={INK}
              strokeWidth={size * 0.025}
              fill="none"
            />
          </g>
        </Rotate>
      )}
      <Rotate rotation={rotation} center={center} reverse>
        <text
          x={center.x}
          y={center.y + size * 0.62}
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize={size * 0.13}
          fill="#faf7e8"
          fontWeight="600"
          stroke={INK}
          strokeWidth={size * 0.015}
          paintOrder="stroke"
        >
          {town.name()?.toUpperCase()}
        </text>
      </Rotate>
    </g>
  );
}

/** The arrow order comes from the same clockwise list used by the rules engine. */
export function rotationGeometry(grid: Grid, size: number) {
  if (
    !DELIVERY_SPACES.every(
      (coordinates) => grid.get(coordinates) instanceof City,
    )
  ) {
    return undefined;
  }
  const points = DELIVERY_SPACES.map((coordinates) =>
    coordinatesToCenter(coordinates, size),
  );
  const center = {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
  const radius =
    Math.max(
      ...points.map((point) =>
        Math.hypot(point.x - center.x, point.y - center.y),
      ),
    ) +
    size * 1.18;
  const gap = (size * 0.9) / radius;
  const pointAt = (angle: number): Point => ({
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  });
  const arcs = points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    const angle = Math.atan2(point.y - center.y, point.x - center.x);
    let nextAngle = Math.atan2(next.y - center.y, next.x - center.x);
    while (nextAngle <= angle) {
      nextAngle += Math.PI * 2;
    }
    const start = pointAt(angle + gap);
    const end = pointAt(nextAngle - gap);
    return {
      from: DELIVERY_SPACES[index],
      to: DELIVERY_SPACES[(index + 1) % points.length],
      path: `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`,
    };
  });
  return { center, radius, arcs };
}

function displayPoint(point: Point, rotation?: Rotation): Point {
  if (rotation === Rotation.COUNTER_CLOCKWISE) {
    return { x: point.y, y: -point.x };
  }
  if (rotation === Rotation.CLOCKWISE) {
    return { x: -point.y, y: point.x };
  }
  return point;
}

export function Fac51FactoryBoard({ grid, size, rotation }: TexturesProps) {
  const prefix = `fac51-factory-${useId().replace(/:/g, "")}`;
  const geometry = rotationGeometry(grid, size);
  if (!geometry) {
    return null;
  }
  const { center, radius, arcs } = geometry;
  const display = displayPoint(center, rotation);
  const left = display.x - radius - size * 0.45;
  const top = display.y - radius - size * 1.48;
  const width = 2 * radius + size * 0.9;
  const height = 2 * radius + size * 2.25;
  const holes = [...grid.values()]
    .map((space) => {
      const corners = getCorners(
        coordinatesToCenter(space.coordinates, size),
        size * 1.006,
      ).map((point) => displayPoint(point, rotation));
      return `M ${corners.map((point) => `${point.x} ${point.y}`).join(" L ")} Z`;
    })
    .join(" ");
  return (
    <g pointerEvents="none" data-fac51-factory-board="true">
      <defs>
        <HazardPattern id={`${prefix}-hazard`} size={size * 3} />
        <marker
          id={`${prefix}-arrow`}
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth={size * 0.42}
          markerHeight={size * 0.42}
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M 0 0 L 12 6 L 0 12 L 3 6 Z" fill={YELLOW} />
        </marker>
      </defs>
      <Rotate rotation={rotation} reverse>
        <path
          d={`M ${left} ${top} h ${width} v ${height} h ${-width} Z ${holes}`}
          fill={INK}
          fillRule="evenodd"
        />
        <rect
          x={left}
          y={top}
          width={width}
          height={size * 0.22}
          fill={`url(#${prefix}-hazard)`}
        />
        <rect
          x={left}
          y={top + height - size * 0.22}
          width={width}
          height={size * 0.22}
          fill={`url(#${prefix}-hazard)`}
        />
        <rect
          x={left + size * 0.23}
          y={top + size * 0.42}
          width={size * 3.15}
          height={size * 0.83}
          fill={YELLOW}
          stroke="#080b08"
          strokeWidth={size * 0.045}
        />
        <text
          x={left + size * 0.43}
          y={top + size * 1.07}
          fontFamily="Arial, sans-serif"
          fontSize={size * 0.72}
          letterSpacing={size * 0.065}
          fill={INK}
        >
          FAC51
        </text>
        <text
          x={left + width - size * 0.25}
          y={top + size * 0.7}
          textAnchor="end"
          fill={YELLOW}
          fontFamily="Arial, sans-serif"
          fontWeight="700"
          fontSize={size * 0.3}
          letterSpacing={size * 0.025}
        >
          DELIVERY ROTATION
        </text>
        <text
          x={left + width - size * 0.25}
          y={top + size * 1.02}
          textAnchor="end"
          fill="#e4e0d0"
          fontFamily="Arial, sans-serif"
          fontSize={size * 0.23}
        >
          Clockwise · one space after each round
        </text>
      </Rotate>
      {arcs.map((arc) => (
        <g
          key={arc.from.serialize()}
          data-rotation-from={arc.from.serialize()}
          data-rotation-to={arc.to.serialize()}
        >
          <title>
            {grid.get(arc.from)!.name()} → {grid.get(arc.to)!.name()} after each
            round
          </title>
          <path
            d={arc.path}
            stroke="#929086"
            strokeWidth={size * 0.36}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={arc.path}
            stroke="#363b36"
            strokeWidth={size * 0.33}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={arc.path}
            stroke={YELLOW}
            strokeWidth={size * 0.05}
            strokeDasharray={`${size * 0.13} ${size * 0.11}`}
            fill="none"
            markerEnd={`url(#${prefix}-arrow)`}
          />
        </g>
      ))}
      {[...grid.values()]
        .filter((space): space is Land => space instanceof Land)
        .map((space) => (
          <polygon
            key={space.coordinates.serialize()}
            points={polygon(
              getCorners(coordinatesToCenter(space.coordinates, size), size),
            )}
            fill="none"
            stroke="#d8d3c3"
            strokeOpacity="0.85"
            strokeWidth={size * 0.022}
          />
        ))}
    </g>
  );
}
