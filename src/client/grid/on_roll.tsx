import { Rotation } from "../../engine/game/map_settings";
import { City } from "../../engine/map/city";
import { cityGroupColor, cityGroupTextColor, toLetter } from "../../engine/state/city_group";
import { Rotate } from "../components/rotation";
import { Point, movePointInRadDirection } from "./point";

interface OnRollProps {
  city: City; center: Point; size: number;
  rotation?: Rotation;
}

export function OnRoll({ city, center, size, rotation }: OnRollProps) {
  return <>
    <Rotate rotation={rotation} reverse={true} center={center}>
      <text fontSize={size / 2} x={center.x} y={center.y + size/20} dominantBaseline="middle" textAnchor="middle">
        {city.isUrbanized() ? toLetter(city.onRoll()[0]) : city.onRoll()[0].onRoll}
      </text>
    </Rotate>;
  </>;
}
