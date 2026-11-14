import { CityVisualProps } from "../view_settings";
import { useId } from "react";
import { Rotate } from "../../client/components/rotation";
import { Rotation } from "../../engine/game/map_settings";
import { CityGroup, toLetter } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { coordinatesToCenter, getCorners, polygon } from "../../utils/point";
import {
  cityCenter,
  cityMembers,
  cityOutline,
  cityIdentifier,
} from "./city_geometry";
import * as gridStyles from "../../client/grid/hex_grid.module.css";

// The center is computed from all members of a compound City.
type Props = Omit<CityVisualProps, "center">;

export function HoneybeeCity({
  grid,
  city,
  size,
  rotation,
  clickable,
  highlighted,
}: Props) {
  const members = cityMembers(city, grid);
  const primary = members[0];
  const center = cityCenter(members, size);
  const outline = polygon(cityOutline(members, size));
  const hatchId = `hive-city-${useId().replace(/:/g, "")}`;
  const light = primary.group() === CityGroup.WHITE;
  const color =
    {
      [Good.RED]: "#d41e2d",
      [Good.BLUE]: "#00a2d3",
      [Good.PURPLE]: "#8d5a95",
      [Good.BLACK]: "#444444",
      [Good.YELLOW]: "#f5ac11",
      [Good.WHITE]: "#e9dcc9",
    }[primary.goodColors()[0]] ?? "#888";
  const roll = primary.onRoll()[0];
  const label = roll
    ? primary.isUrbanized()
      ? toLetter(roll)
      : String(roll.onRoll)
    : "";
  const identifier = cityIdentifier(
    size,
    members.length > 1,
    primary.goodColors()[0],
  );
  const ink = light ? "#fff" : "#242021";
  return (
    <>
      {city.coordinates.equals(primary.coordinates) && (
        <g
          pointerEvents="none"
          data-honeybee-city={primary.coordinates.serialize()}
          data-city-hex-count={members.length}
        >
          {primary.accepts(Good.PURPLE) && (
            <defs>
              <pattern
                id={hatchId}
                patternUnits="userSpaceOnUse"
                width={size * 0.18}
                height={size * 0.18}
                patternTransform={`rotate(${rotation === Rotation.CLOCKWISE ? -60 : rotation === Rotation.COUNTER_CLOCKWISE ? 120 : 30})`}
              >
                <rect width={size * 0.18} height={size * 0.18} fill={color} />
                <rect
                  width={size * 0.075}
                  height={size * 0.18}
                  fill="#ba8fc2"
                />
              </pattern>
            </defs>
          )}
          <polygon
            points={outline}
            fill={primary.accepts(Good.PURPLE) ? `url(#${hatchId})` : color}
            stroke="#70675b"
            strokeWidth={size * 0.055}
            strokeLinejoin="round"
          />
          <Rotate rotation={rotation} center={center} reverse>
            <text
              x={center.x + identifier.number.x}
              y={center.y + identifier.number.y}
              dominantBaseline="middle"
              textAnchor="middle"
              fill={ink}
              fontSize={size * 0.46}
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
            >
              {label}
            </text>
            <image
              href={`/static/maps/honeybee-hive-mind/city-bee-${light ? "white" : "black"}.svg`}
              x={center.x + identifier.bee.x}
              y={center.y + identifier.bee.y}
              width={identifier.bee.width}
              height={identifier.bee.height}
              preserveAspectRatio="xMidYMid meet"
            />
          </Rotate>
        </g>
      )}
      <polygon
        points={polygon(
          getCorners(coordinatesToCenter(city.coordinates, size), size),
        )}
        fill="transparent"
        className={clickable ? gridStyles.clickable : undefined}
        data-coordinates={city.coordinates.serialize()}
      />
      {highlighted && (
        <polygon
          points={outline}
          fill="none"
          stroke="yellow"
          strokeWidth={size * 0.06}
          pointerEvents="none"
        />
      )}
    </>
  );
}
