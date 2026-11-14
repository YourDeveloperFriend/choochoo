import { HONEYBEE_GOOD_IMAGE } from "./identity";

interface BeeCubeProps {
  x: number;
  y: number;
  size: number;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
  coordinates?: string;
  good?: number;
}

/** Joshua's bee artwork, fitted to the existing goods footprint and hit target. */
export function BeeCube({
  x,
  y,
  size,
  stroke = "black",
  strokeWidth = 1,
  className,
  coordinates,
  good,
}: BeeCubeProps) {
  const extent = size * 1.3;
  return (
    <g role="img" aria-label="Bee swarm (yellow good)">
      <title>Bee swarm (yellow good)</title>
      <image
        href={HONEYBEE_GOOD_IMAGE}
        x={x}
        y={y}
        width={extent}
        height={extent}
        preserveAspectRatio="xMidYMid meet"
        className={className}
        data-coordinates={coordinates}
        data-good={good}
      />
      {stroke !== "black" && (
        <rect
          x={x}
          y={y}
          width={extent}
          height={extent}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={strokeWidth}
          pointerEvents="none"
        />
      )}
    </g>
  );
}
