import { Rotation } from "../../engine/game/map_settings";
import { City } from "../../engine/map/city";
import { CityGroup, toLetter } from "../../engine/state/city_group";
import { Rotate } from "../components/rotation";
import { Point } from "./point";

interface OnRollProps {
  city: City;
  center: Point;
  size: number;
  cityGroup: CityGroup;
  rotation?: Rotation;
}

export function OnRoll({
  city,
  center,
  cityGroup,
  size,
  rotation,
}: OnRollProps) {
  return (
    <>
      <circle
        cx={center.x}
        cy={center.y}
        fill={cityGroup == CityGroup.WHITE ? "#ffffff" : "#222222"}
        r={size * 0.4}
      />
      <Rotate rotation={rotation} reverse={true} center={center}>
        <text
          fontSize={size / 2}
          fill={
            city.onRoll()[0]?.group == CityGroup.BLACK ? "#ffffff" : "#222222"
          }
          x={center.x}
          y={center.y + size / 20}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {city.isUrbanized()
            ? toLetter(city.onRoll()[0])
            : city.onRoll()[0].onRoll}
        </text>
      </Rotate>
      ;
    </>
  );
}
